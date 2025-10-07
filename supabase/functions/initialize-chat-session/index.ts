
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initialize chat session function called');

    // Get the request body
    const { report_id } = await req.json();
    console.log('Report ID:', report_id);

    if (!report_id) {
      console.error('No report_id provided');
      return new Response(JSON.stringify({ error: 'report_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client to verify report exists and is in correct status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify report exists and is in pending_review status
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      console.error('Report not found:', reportError);
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (report.status !== 'pending_review') {
      console.error('Report status is not pending_review:', report.status);
      return new Response(JSON.stringify({
        error: 'Report is not ready for chat',
        current_status: report.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get N8N webhook trigger URL from environment
    const n8nWebhookTriggerUrl = Deno.env.get("N8N_WEBHOOK_TRIGGER_URL");

    if (!n8nWebhookTriggerUrl) {
      console.error('N8N_WEBHOOK_TRIGGER_URL environment variable not set');
      return new Response(JSON.stringify({ error: 'Chat webhook trigger URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling n8n webhook trigger');

    // Call the n8n webhook trigger
    const response = await fetch(n8nWebhookTriggerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report_id: report_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("N8N webhook trigger error:", response.status, errorText);
      return new Response(JSON.stringify({
        error: 'Failed to initialize chat session',
        details: errorText
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    console.log('N8N webhook trigger response:', result);

    return new Response(JSON.stringify({
      success: true,
      result,
      message: 'Chat session initialized successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in initialize-chat-session function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
