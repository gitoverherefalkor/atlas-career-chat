
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
    console.log('=== SIMPLE RELEVANCE TEST STARTED ===');
    
    // Step 1: Check environment variables
    const relevanceApiKey = Deno.env.get("RELEVANCE_API_KEY");
    const agentId = Deno.env.get("RELEVANCE_AGENT_ID");
    
    console.log('Environment check:');
    console.log('RELEVANCE_API_KEY exists:', !!relevanceApiKey);
    console.log('RELEVANCE_AGENT_ID exists:', !!agentId);
    
    if (!relevanceApiKey || !agentId) {
      return new Response(JSON.stringify({ 
        error: 'Missing environment variables',
        missing: {
          api_key: !relevanceApiKey,
          agent_id: !agentId
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step 2: Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Step 3: Create a simple test report
    console.log('Creating test report...');
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        title: 'SIMPLE TEST - Career Assessment Report',
        status: 'processing',
        payload: {
          test: true,
          message: 'Simple test payload',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating test report:', reportError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create test report',
        details: reportError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Test report created with ID:', reportData.id);

    // Step 4: Create minimal survey data
    const mockSurveyData = {
      test: true,
      personal_name: "Test User",
      current_role: "Software Engineer",
      goals_short_term: "Learn new technologies"
    };

    // Step 5: Test Relevance AI directly
    const relevancePayload = {
      message: { 
        role: "user", 
        content: "SIMPLE TEST: Create report sections for this survey data" 
      },
      agent_id: agentId,
      inputs: {
        report_id: reportData.id,
        survey_data: mockSurveyData
      }
    };

    console.log('=== TESTING RELEVANCE AI ===');
    console.log('Report ID:', reportData.id);
    console.log('Payload:', JSON.stringify(relevancePayload, null, 2));

    const relevanceResponse = await fetch(
      "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${relevanceApiKey}`,
        },
        body: JSON.stringify(relevancePayload),
      },
    );

    console.log('Relevance response status:', relevanceResponse.status);
    
    if (!relevanceResponse.ok) {
      const errorText = await relevanceResponse.text();
      console.error("❌ Relevance AI error:", relevanceResponse.status, errorText);
      
      // Update report status to failed
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportData.id);
      
      return new Response(JSON.stringify({ 
        error: 'Relevance AI request failed',
        status: relevanceResponse.status,
        details: errorText,
        report_id: reportData.id
      }), { 
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const relevanceResult = await relevanceResponse.json();
    console.log('✅ Relevance AI response:', relevanceResult);

    // Step 6: Update report status to completed
    await supabase
      .from('reports')
      .update({ status: 'completed' })
      .eq('id', reportData.id);

    // Step 7: Check if any report sections were created
    const { data: sections, error: sectionsError } = await supabase
      .from('report_sections')
      .select('*')
      .eq('report_id', reportData.id);

    console.log('Report sections check:', sections?.length || 0, 'sections found');

    return new Response(JSON.stringify({ 
      success: true,
      message: "Simple test completed successfully!",
      results: {
        report_id: reportData.id,
        relevance_response: relevanceResult,
        sections_created: sections?.length || 0,
        sections: sections || []
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in simple test:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
