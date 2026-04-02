import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight, errorResponse } from "../_shared/cors.ts";

// Deletes ALL data for the authenticated user (GDPR Art. 17 - Right to Erasure)
// Order matters: delete child records first to respect foreign key constraints

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Extract user JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization required', 401, corsHeaders);
    }

    // Create a client with the user's JWT to verify identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse('Invalid authentication', 401, corsHeaders);
    }

    const userId = user.id;
    console.log(`[delete-user-data] Starting deletion for user ${userId}`);

    // Use service role for actual deletion (needs elevated permissions)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const errors: string[] = [];

    // 1. Delete chat messages
    const { error: chatError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);
    if (chatError) errors.push(`chat_messages: ${chatError.message}`);

    // 2. Delete report sections (via report ownership)
    const { data: reports } = await supabase
      .from('reports')
      .select('id')
      .eq('user_id', userId);

    if (reports && reports.length > 0) {
      const reportIds = reports.map(r => r.id);
      const { error: sectionsError } = await supabase
        .from('report_sections')
        .delete()
        .in('report_id', reportIds);
      if (sectionsError) errors.push(`report_sections: ${sectionsError.message}`);
    }

    // 3. Delete reports
    const { error: reportsError } = await supabase
      .from('reports')
      .delete()
      .eq('user_id', userId);
    if (reportsError) errors.push(`reports: ${reportsError.message}`);

    // 4. Delete engagement tracking
    const { error: engagementError } = await supabase
      .from('user_engagement_tracking')
      .delete()
      .eq('user_id', userId);
    if (engagementError) errors.push(`engagement_tracking: ${engagementError.message}`);

    // 5. Delete resume files from storage
    try {
      const { data: files } = await supabase.storage
        .from('resumes')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('resumes').remove(filePaths);
      }
    } catch (storageError) {
      errors.push(`storage: ${String(storageError)}`);
    }

    // 6. Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) errors.push(`profiles: ${profileError.message}`);

    // 7. Delete the auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteError) errors.push(`auth: ${authDeleteError.message}`);

    if (errors.length > 0) {
      console.error(`[delete-user-data] Partial deletion for ${userId}:`, errors);
      // Still return success - partial deletion is better than no deletion
      // Log the errors for admin follow-up
      return new Response(JSON.stringify({
        success: true,
        message: 'Account deleted. Some data may require manual cleanup.',
        partial_errors: errors.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[delete-user-data] Complete deletion for user ${userId}`);
    return new Response(JSON.stringify({
      success: true,
      message: 'All account data has been permanently deleted.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[delete-user-data] Error:', error);
    return errorResponse('An error occurred while deleting your account. Please contact support.', 500, corsHeaders);
  }
});
