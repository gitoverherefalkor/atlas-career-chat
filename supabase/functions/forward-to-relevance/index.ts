
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
    console.log('Forward to Relevance function called');
    
    // Get the request body
    const requestBody = await req.json();
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    
    // Extract the payload from the request body
    const surveyData = requestBody.payload || requestBody;
    console.log('Survey data to send:', JSON.stringify(surveyData, null, 2));

    if (!surveyData) {
      console.error('No survey data found in request');
      return new Response(JSON.stringify({ error: 'No survey data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert the survey data to a JSON string as expected by Relevance AI
    const content = JSON.stringify(surveyData);

    // Build the Relevance AI request body
    const body = {
      message: { role: "user", content },
      agent_id: Deno.env.get("RELEVANCE_AGENT_ID"),
    };

    console.log('Sending to Relevance AI with agent_id:', Deno.env.get("RELEVANCE_AGENT_ID"));
    console.log('Request body for Relevance AI:', JSON.stringify(body, null, 2));

    // POST to Relevance AI
    const resp = await fetch(
      "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Deno.env.get("RELEVANCE_API_KEY")!,
        },
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Relevance AI error:", resp.status, err);
      return new Response(`Upstream error: ${resp.status} ${err}`, { 
        status: 502,
        headers: corsHeaders 
      });
    }

    const result = await resp.json();
    console.log('Relevance AI response:', result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forward-to-relevance function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
