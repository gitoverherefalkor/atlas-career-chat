import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifySharedSecret, errorResponse } from "../_shared/cors.ts";

// n8n-called function — no browser CORS needed
const serverHeaders = { 'Content-Type': 'application/json' };

serve(async (req) => {
  // No CORS preflight needed — this is server-to-server only
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  // Verify shared secret from n8n
  const authError = verifySharedSecret(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    let { report_id: reportId } = body;

    // Handle case where report_id comes as {answer: "uuid"} from n8n
    if (reportId && typeof reportId === 'object' && reportId.answer) {
      reportId = reportId.answer;
    }

    if (!reportId) {
      return errorResponse('report_id is required', 400, serverHeaders);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update report to mark chat session as complete
    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('Failed to update report status:', updateError);
      return errorResponse('Failed to update report status', 500, serverHeaders);
    }

    return new Response(JSON.stringify({
      success: true,
      report_id: reportId,
      status: 'completed'
    }), {
      headers: serverHeaders,
    });
  } catch (error) {
    console.error('Error in chat-session-complete:', error);
    return errorResponse('Internal server error', 500, serverHeaders);
  }
});
