
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
    console.log('Forward to Relevance function called');
    
    // Get the request body
    const requestBody = await req.json();
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    
    // Extract the payload from the request body - preserve exact order
    const surveyData = requestBody.payload || requestBody;
    console.log('Survey data to send (preserving order):', JSON.stringify(surveyData, null, 2));

    if (!surveyData) {
      console.error('No survey data found in request');
      return new Response(JSON.stringify({ error: 'No survey data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Find the user with email sjn.geurts@gmail.com or create a default user for testing
    let userId = requestBody.user_id;
    
    if (!userId) {
      console.log('No user_id provided, looking for test user sjn.geurts@gmail.com');
      
      // First try to find the user by email in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'sjn.geurts@gmail.com')
        .maybeSingle();
      
      if (profileData) {
        userId = profileData.id;
        console.log('Found user ID from profiles:', userId);
      } else {
        console.log('User not found in profiles, using fallback user ID');
        // Use a fallback user ID for testing - you can replace this with any valid UUID
        userId = '00000000-0000-0000-0000-000000000000';
      }
    }

    // Step 1: Create a report record first
    console.log('Creating report record for user:', userId);
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        title: 'Career Assessment Report',
        status: 'processing',
        payload: surveyData,
        access_code_id: requestBody.access_code_id || null,
        survey_id: requestBody.survey_id || null
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return new Response(JSON.stringify({ error: 'Failed to create report record', details: reportError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Report created with ID:', reportData.id);

    // Step 2: Build the Relevance AI request body with report_id as input variable
    // IMPORTANT: Use the exact surveyData object to preserve order
    const body = {
      message: { 
        role: "user", 
        content: JSON.stringify(surveyData)
      },
      agent_id: Deno.env.get("RELEVANCE_AGENT_ID"),
      inputs: {
        report_id: reportData.id,
        survey_data: surveyData
      }
    };

    console.log('Sending to Relevance AI with agent_id:', Deno.env.get("RELEVANCE_AGENT_ID"));
    console.log('Report ID being sent as input:', reportData.id);
    console.log('Survey data being sent (should preserve order):', JSON.stringify(surveyData, null, 2));

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
      
      // Update report status to failed
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportData.id);
      
      return new Response(`Upstream error: ${resp.status} ${err}`, { 
        status: 502,
        headers: corsHeaders 
      });
    }

    const result = await resp.json();
    console.log('Relevance AI response:', result);

    // Note: We no longer update status to completed here
    // The analysis-completed webhook will handle that when Relevance finishes processing

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      report_id: reportData.id 
    }), {
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
