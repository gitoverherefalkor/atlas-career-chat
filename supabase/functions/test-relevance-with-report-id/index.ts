
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
    console.log('Test Relevance with Report ID function called');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Step 1: Create a real report record first
    console.log('Creating test report record...');
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        title: 'TEST - Career Assessment Report',
        status: 'processing',
        payload: {
          test: true,
          message: 'This is a test payload for Relevance AI'
        }
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating test report:', reportError);
      return new Response(JSON.stringify({ error: 'Failed to create test report record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Test report created with ID:', reportData.id);

    // Step 2: Create mock survey data
    const mockSurveyData = {
      test: true,
      survey_type: "Career Assessment Test",
      answers: {
        question_1: "I enjoy working with teams",
        question_2: "I prefer analytical tasks",
        question_3: "I like creative challenges"
      },
      timestamp: new Date().toISOString()
    };

    // Step 3: Build the Relevance AI request body with the REAL report_id
    const body = {
      message: { 
        role: "user", 
        content: "TEST MESSAGE: Process this mock survey data and create report sections" 
      },
      agent_id: Deno.env.get("RELEVANCE_AGENT_ID"),
      inputs: {
        report_id: reportData.id,  // This is the REAL UUID from our reports table
        survey_data: mockSurveyData
      }
    };

    console.log('=== SENDING TEST PAYLOAD TO RELEVANCE AI ===');
    console.log('Agent ID:', Deno.env.get("RELEVANCE_AGENT_ID"));
    console.log('Report ID being sent:', reportData.id);
    console.log('Complete request body:', JSON.stringify(body, null, 2));

    // Step 4: POST to Relevance AI
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
      
      return new Response(`Relevance AI error: ${resp.status} ${err}`, { 
        status: 502,
        headers: corsHeaders 
      });
    }

    const result = await resp.json();
    console.log('Relevance AI response:', result);

    // Update report status to completed
    await supabase
      .from('reports')
      .update({ status: 'completed' })
      .eq('id', reportData.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Test completed successfully!",
      report_id: reportData.id,
      relevance_response: result,
      instructions: "Use this report_id in your Relevance AI workflow: " + reportData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
