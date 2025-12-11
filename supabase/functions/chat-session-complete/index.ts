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
    const body = await req.json().catch(() => ({}));
    let { report_id: reportId } = body;

    // Handle case where report_id comes as {answer: "uuid"} from n8n
    if (reportId && typeof reportId === 'object' && reportId.answer) {
      reportId = reportId.answer;
    }

    console.log('Chat session complete called for report:', reportId);

    if (!reportId) {
      return new Response(JSON.stringify({ error: 'report_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Failed to update report status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Report marked as completed:', updated);

    return new Response(JSON.stringify({
      success: true,
      report_id: reportId,
      status: 'completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-session-complete:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
