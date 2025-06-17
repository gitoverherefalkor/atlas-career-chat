
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
    console.log('Test N8N integration function called');
    
    // Mock survey responses for Sjoerd Geurts in order (Q1, Q2, Q3, etc.)
    const orderedSurveyData = {
      "q1_personal_name": "Sjoerd Geurts",
      "q2_personal_age": 35,
      "q3_personal_education": "Master's Degree",
      "q4_personal_experience": 12,
      "q5_personal_location": "Amsterdam, Netherlands",
      "q6_current_role": "Product Manager",
      "q7_current_industry": "Technology/SaaS",
      "q8_current_company_size": "Medium (100-500 employees)",
      "q9_current_satisfaction": 6,
      "q10_current_challenges": "Limited growth opportunities and unclear career progression",
      "q11_skills_technical": ["Product Strategy", "Data Analysis", "User Research", "Project Management"],
      "q12_skills_soft": ["Leadership", "Communication", "Strategic Thinking", "Problem Solving"],
      "q13_skills_rating_communication": 9,
      "q14_skills_rating_leadership": 7,
      "q15_skills_rating_creativity": 8,
      "q16_skills_rating_analytical": 9,
      "q17_skills_rating_interpersonal": 8,
      "q18_interests_primary": ["Product Development", "User Experience", "Business Strategy"],
      "q19_interests_activities": "Reading about product trends, attending industry conferences, mentoring junior PMs",
      "q20_values_ranking": ["Growth Opportunities", "Innovation", "Work-Life Balance", "High Salary", "Recognition", "Autonomy", "Job Security", "Social Impact"],
      "q21_values_work_environment": "Collaborative with clear vision and strong leadership",
      "q22_goals_short_term": "Become a Senior Product Manager and lead larger product initiatives",
      "q23_goals_long_term": "VP of Product or Chief Product Officer role",
      "q24_goals_industries_interested": ["Technology", "Healthcare Tech", "Fintech", "EdTech"],
      "q25_goals_preferred_role_type": "Leadership with hands-on involvement",
      "q26_goals_work_preference": "Hybrid with some remote flexibility",
      "q27_personality_work_style": "I prefer structured collaboration with clear objectives and regular check-ins",
      "q28_personality_decision_making": "Data-informed with stakeholder input and strategic consideration",
      "q29_personality_stress_management": "I prioritize tasks, delegate effectively, and maintain open communication",
      "q30_personality_motivation": "Solving complex user problems and seeing product impact",
      "q31_personality_team_role": "The strategic leader who aligns teams around product vision",
      "q32_additional_ideal_day": "Strategic planning, user research analysis, team collaboration, and product roadmap refinement",
      "q33_additional_avoid": "Micromanagement and endless meetings without clear outcomes",
      "q34_additional_learning_style": "Case studies, peer discussions, and hands-on experimentation",
      "q35_additional_feedback": "I value honest, constructive feedback focused on growth and impact"
    };

    console.log('Test survey data prepared (in order):', JSON.stringify(orderedSurveyData, null, 2));

    // Use the production N8N webhook URL you provided
    const n8nWebhookUrl = "https://falkoratlas.app.n8n.cloud/webhook/dfe2a07c-8b6c-4c42-a6bc-e9bb14381778";
    
    console.log('Using production N8N webhook URL:', n8nWebhookUrl);

    // Test data to send to N8N
    const testData = {
      user_id: "test-user-sjoerd-geurts",
      report_id: "test-report-" + Date.now(),
      access_code_id: "test-access-code",
      survey_id: "00000000-0000-0000-0000-000000000001",
      survey_responses: orderedSurveyData,
      created_at: new Date().toISOString(),
      processing_status: "test-run",
      test_mode: true
    };

    console.log('Sending test data to N8N webhook:', n8nWebhookUrl);
    console.log('Test payload:', JSON.stringify(testData, null, 2));

    // POST to N8N webhook
    const resp = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    // Log detailed response information
    console.log('N8N webhook status code:', resp.status);
    console.log('N8N webhook status text:', resp.statusText);
    console.log('N8N webhook headers:', Object.fromEntries(resp.headers.entries()));

    if (!resp.ok) {
      const err = await resp.text();
      console.error("N8N webhook test error:", resp.status, err);
      return new Response(JSON.stringify({ 
        error: `N8N webhook test failed: ${resp.status} ${resp.statusText}`,
        details: err,
        webhook_url: n8nWebhookUrl
      }), { 
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle both JSON and text responses from N8N
    let result;
    const responseText = await resp.text();
    console.log('N8N webhook raw response:', responseText);
    
    try {
      // Try to parse as JSON first
      result = JSON.parse(responseText);
      console.log('N8N webhook parsed JSON response:', result);
    } catch (parseError) {
      // If it's not JSON, treat it as a text response
      console.log('N8N webhook returned text response (not JSON):', responseText);
      result = { 
        message: responseText,
        raw_response: responseText,
        type: 'text_response'
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test data sent to N8N workflow successfully',
      webhook_url: n8nWebhookUrl,
      test_data: testData,
      n8n_response: result,
      response_type: typeof result === 'string' ? 'text' : 'json',
      status_code: resp.status,
      status_text: resp.statusText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-n8n-integration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to test N8N integration'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
