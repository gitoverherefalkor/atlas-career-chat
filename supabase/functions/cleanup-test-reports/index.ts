import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Cleanup test reports function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Look for user with email sjn.geurts@gmail.com
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'sjn.geurts@gmail.com')
      .maybeSingle();

    if (!profileData) {
      return new Response(JSON.stringify({ error: 'Test user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = profileData.id;

    // Get all reports for this user, ordered by creation date (newest first)
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('id, created_at, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      throw reportsError;
    }

    if (!reports || reports.length <= 1) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No cleanup needed - 1 or fewer reports found',
        reports_count: reports?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Keep the newest report, delete the rest
    const reportsToDelete = reports.slice(1); // Skip the first (newest) report
    const reportIdsToDelete = reportsToDelete.map(r => r.id);

    console.log(`Deleting ${reportIdsToDelete.length} old reports, keeping the newest one`);

    // First delete all report sections for the reports we're deleting
    const { error: sectionsError } = await supabase
      .from('report_sections')
      .delete()
      .in('report_id', reportIdsToDelete);

    if (sectionsError) {
      console.error('Error deleting report sections:', sectionsError);
      throw sectionsError;
    }

    // Then delete the reports
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .in('id', reportIdsToDelete);

    if (deleteError) {
      console.error('Error deleting reports:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully cleaned up ${reportIdsToDelete.length} old reports`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Cleaned up ${reportIdsToDelete.length} old reports, kept the newest one`,
      deleted_count: reportIdsToDelete.length,
      kept_report: reports[0].title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cleanup-test-reports function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
