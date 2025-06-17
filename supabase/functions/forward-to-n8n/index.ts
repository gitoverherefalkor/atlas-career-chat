
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
    console.log('Forward to N8N function called');
    
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
        title: 'Career Assessment Report (N8N)',
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

    // Step 2: Build the N8N request body - format as JSON items
    const n8nData = {
      // Main item with all the data
      user_id: userId,
      report_id: reportData.id,
      access_code_id: requestBody.access_code_id || null,
      survey_id: requestBody.survey_id || null,
      // Survey data preserving order - this is the key part
      survey_responses: surveyData,
      // Additional metadata
      created_at: new Date().toISOString(),
      processing_status: 'started'
    };

    console.log('Sending to N8N webhook');
    console.log('Report ID being sent:', reportData.id);
    console.log('N8N payload (preserving survey response order):', JSON.stringify(n8nData, null, 2));

    // Get N8N webhook URL from environment
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable not set');
      
      // Update report status to failed
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportData.id);
      
      return new Response(JSON.stringify({ error: 'N8N webhook URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST to N8N webhook
    const resp = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nData),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("N8N webhook error:", resp.status, err);
      
      // Update report status to failed
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportData.id);
      
      return new Response(`N8N webhook error: ${resp.status} ${err}`, { 
        status: 502,
        headers: corsHeaders 
      });
    }

    const result = await resp.json();
    console.log('N8N webhook response:', result);

    // Note: We don't update status to completed here
    // The N8N workflow should call back to update the report when processing is done

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      report_id: reportData.id,
      message: 'Data sent to N8N workflow successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forward-to-n8n function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
