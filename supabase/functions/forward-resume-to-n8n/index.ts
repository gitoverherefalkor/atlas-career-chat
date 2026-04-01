import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getCorsHeaders, handleCorsPreFlight, errorResponse } from "../_shared/cors.ts";

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  try {
    const { file_url, user_id } = await req.json();

    if (!file_url || !user_id) {
      return errorResponse('file_url and user_id are required', 400, corsHeaders);
    }

    const n8nWebhookUrl = Deno.env.get("N8N_RESUME_WEBHOOK_URL");
    if (!n8nWebhookUrl) {
      console.error('N8N_RESUME_WEBHOOK_URL not set');
      return errorResponse('Resume processing is temporarily unavailable.', 500, corsHeaders);
    }

    // POST to n8n with 60-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let resp: Response;
    try {
      resp = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_url, user_id }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('n8n webhook timed out after 60s');
        return errorResponse('Resume processing timed out. Please try again.', 504, corsHeaders);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('n8n webhook error:', resp.status, errText);
      return errorResponse('Resume processing failed. Please try again.', 502, corsHeaders);
    }

    const result = await resp.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forward-resume-to-n8n:', error);
    return errorResponse('An error occurred processing your resume. Please try again.', 500, corsHeaders);
  }
});
