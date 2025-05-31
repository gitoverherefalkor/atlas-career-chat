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

    // Log API key format for debugging (first 10 chars only)
    console.log('API Key format check (first 10 chars):', relevanceApiKey.substring(0, 10));
    console.log('Agent ID:', agentId);
    
    // Step 2: Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Step 3: First, let's find a real user or create a test user
    console.log('Checking for existing users...');
    const { data: existingUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    let testUserId;
    if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
      // Use the first existing user
      testUserId = existingUsers.users[0].id;
      console.log('Using existing user ID:', testUserId);
    } else {
      // Create a temporary test user
      console.log('No existing users found, creating test user...');
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: 'test-user@example.com',
        password: 'temp-password-123',
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('Error creating test user:', createUserError);
        return new Response(JSON.stringify({ 
          error: 'Failed to create test user',
          details: createUserError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      testUserId = newUser.user.id;
      console.log('Created test user with ID:', testUserId);
    }

    // Step 4: Create a simple test report with real user ID
    console.log('Creating test report...');
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: testUserId,
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

    // Step 5: Create minimal survey data
    const mockSurveyData = {
      test: true,
      personal_name: "Test User",
      current_role: "Software Engineer",
      goals_short_term: "Learn new technologies"
    };

    // Step 6: Test Relevance AI directly with corrected authorization
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

    // Try different authorization header formats
    const authHeaders = {
      "Content-Type": "application/json",
      "Authorization": `${relevanceApiKey}`, // Remove "Bearer " prefix
    };

    console.log('Authorization header being used:', `${relevanceApiKey.substring(0, 10)}...`);

    const relevanceResponse = await fetch(
      "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(relevancePayload),
      },
    );

    console.log('Relevance response status:', relevanceResponse.status);
    
    if (!relevanceResponse.ok) {
      const errorText = await relevanceResponse.text();
      console.error("❌ Relevance AI error:", relevanceResponse.status, errorText);
      
      // Try alternative authorization format if first attempt fails
      if (relevanceResponse.status === 403) {
        console.log('Trying alternative authorization format...');
        
        const altAuthHeaders = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${relevanceApiKey}`, // Add "Bearer " prefix
        };

        const altResponse = await fetch(
          "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
          {
            method: "POST",
            headers: altAuthHeaders,
            body: JSON.stringify(relevancePayload),
          },
        );

        console.log('Alternative auth response status:', altResponse.status);
        
        if (!altResponse.ok) {
          const altErrorText = await altResponse.text();
          console.error("❌ Alternative auth also failed:", altResponse.status, altErrorText);
          
          // Update report status to failed
          await supabase
            .from('reports')
            .update({ status: 'failed' })
            .eq('id', reportData.id);
          
          return new Response(JSON.stringify({ 
            error: 'Relevance AI authentication failed with both formats',
            status_1: relevanceResponse.status,
            details_1: errorText,
            status_2: altResponse.status,
            details_2: altErrorText,
            report_id: reportData.id,
            debug: {
              api_key_preview: relevanceApiKey.substring(0, 10) + '...',
              agent_id: agentId
            }
          }), { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const altResult = await altResponse.json();
        console.log('✅ Alternative auth successful! Relevance AI response:', altResult);

        // Update report status to completed
        await supabase
          .from('reports')
          .update({ status: 'completed' })
          .eq('id', reportData.id);

        // Step 8: Check if any report sections were created
        const { data: sections, error: sectionsError } = await supabase
          .from('report_sections')
          .select('*')
          .eq('report_id', reportData.id);

        console.log('Report sections check:', sections?.length || 0, 'sections found');

        return new Response(JSON.stringify({ 
          success: true,
          message: "Simple test completed successfully with alternative auth!",
          results: {
            test_user_id: testUserId,
            report_id: reportData.id,
            relevance_response: altResult,
            sections_created: sections?.length || 0,
            sections: sections || [],
            auth_method: 'Bearer prefix'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Update report status to failed for non-403 errors
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

    // Step 7: Update report status to completed
    await supabase
      .from('reports')
      .update({ status: 'completed' })
      .eq('id', reportData.id);

    // Step 8: Check if any report sections were created
    const { data: sections, error: sectionsError } = await supabase
      .from('report_sections')
      .select('*')
      .eq('report_id', reportData.id);

    console.log('Report sections check:', sections?.length || 0, 'sections found');

    return new Response(JSON.stringify({ 
      success: true,
      message: "Simple test completed successfully!",
      results: {
        test_user_id: testUserId,
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
