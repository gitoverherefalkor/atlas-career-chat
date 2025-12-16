
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
    // Mock survey responses for Sjoerd Geurts in the detailed format N8N expects
    const detailedSurveyData = [
      {
        title: "Your name",
        type: "short_text",
        answer: "Sjoerd Geurts"
      },
      {
        title: "Your pronoun", 
        type: "multiple_choice",
        answer: "He / Him"
      },
      {
        title: "Your age",
        type: "number", 
        answer: 35
      },
      {
        title: "What region are you based?",
        type: "dropdown",
        answer: "Northern and Western Europe"
      },
      {
        title: "My primary goal(s) for completing this questionnaire and receiving a report",
        type: "multiple_choice",
        allow_multiple_selections: true,
        allow_other_choice: true,
        answer: "• Career transition guidance and exploring new opportunities"
      },
      {
        title: "What is the highest level of education you have completed?",
        type: "multiple_choice",
        answer: "Master's degree"
      },
      {
        title: "What subject or specialization did you study?",
        type: "short_text", 
        answer: "Business Administration"
      },
      {
        title: "How many *years of professional experience *do you have?",
        type: "number",
        answer: 12
      },
      {
        title: "What best describes your current career situation?",
        type: "multiple_choice",
        answer: "*Product Management *(roles focused on product strategy, development, and lifecycle management)"
      },
      {
        title: "What industry do you currently work in?",
        type: "multiple_choice",
        answer: "Technology/SaaS"
      },
      {
        title: "What is the size of your current organization?",
        type: "multiple_choice", 
        answer: "Medium (100-500 employees)"
      },
      {
        title: "On a scale of 1-10, how satisfied are you with your current career situation?",
        type: "rating",
        answer: 6
      },
      {
        title: "What are your main challenges or pain points in your current career situation?",
        type: "long_text",
        answer: "Limited growth opportunities and unclear career progression. The company lacks a clear product vision and strategic direction."
      },
      {
        title: "What technical skills do you possess?",
        type: "multiple_choice",
        allow_multiple_selections: true,
        answer: "• Product Strategy • Data Analysis • User Research • Project Management"
      },
      {
        title: "What soft skills do you possess?", 
        type: "multiple_choice",
        allow_multiple_selections: true,
        answer: "• Leadership • Communication • Strategic Thinking • Problem Solving"
      },
      {
        title: "Rate your communication skills",
        type: "rating",
        answer: 9
      },
      {
        title: "Rate your leadership abilities",
        type: "rating", 
        answer: 7
      },
      {
        title: "Rate your creativity and innovation",
        type: "rating",
        answer: 8
      },
      {
        title: "Rate your analytical and problem-solving skills",
        type: "rating",
        answer: 9
      },
      {
        title: "Rate your interpersonal and relationship-building skills",
        type: "rating",
        answer: 8
      },
      {
        title: "What are your primary interests or passions?",
        type: "multiple_choice",
        allow_multiple_selections: true,
        answer: "• Product Development • User Experience • Business Strategy"
      },
      {
        title: "What activities or topics energize you outside of work?",
        type: "long_text",
        answer: "Reading about product trends, attending industry conferences, mentoring junior PMs, and exploring new technologies."
      },
      {
        title: "Rank these work values in order of importance to you",
        type: "ranking",
        answer: ["Growth Opportunities", "Innovation", "Work-Life Balance", "High Salary", "Recognition", "Autonomy", "Job Security", "Social Impact"]
      },
      {
        title: "What type of work environment brings out your best?",
        type: "long_text",
        answer: "Collaborative environment with clear vision and strong leadership where I can contribute to strategic decisions."
      },
      {
        title: "What are your short-term career goals (1-2 years)?",
        type: "long_text",
        answer: "Become a Senior Product Manager and lead larger product initiatives with more strategic impact."
      },
      {
        title: "What are your long-term career aspirations (5+ years)?",
        type: "long_text", 
        answer: "VP of Product or Chief Product Officer role where I can shape product strategy at an organizational level."
      },
      {
        title: "What industries or sectors interest you for future opportunities?",
        type: "multiple_choice",
        allow_multiple_selections: true,
        answer: "• Technology • Healthcare Tech • Fintech • EdTech"
      },
      {
        title: "What type of role would you prefer?",
        type: "multiple_choice",
        answer: "Leadership with hands-on involvement"
      },
      {
        title: "What is your preferred work arrangement?",
        type: "multiple_choice",
        answer: "Hybrid with some remote flexibility"
      },
      {
        title: "Describe your preferred work style and approach",
        type: "long_text",
        answer: "I prefer structured collaboration with clear objectives and regular check-ins. I thrive in environments where data-driven decisions are valued."
      },
      {
        title: "How do you typically approach decision-making?",
        type: "long_text",
        answer: "Data-informed with stakeholder input and strategic consideration. I gather relevant information, consult with key stakeholders, and consider long-term implications."
      },
      {
        title: "How do you handle stress and pressure?",
        type: "long_text", 
        answer: "I prioritize tasks, delegate effectively, and maintain open communication with my team during high-pressure situations."
      },
      {
        title: "What motivates you most in your work?",
        type: "long_text",
        answer: "Solving complex user problems and seeing the direct impact of product decisions on user satisfaction and business growth."
      },
      {
        title: "What role do you typically play in team settings?",
        type: "long_text",
        answer: "The strategic leader who aligns teams around product vision and facilitates cross-functional collaboration."
      },
      {
        title: "Describe your ideal workday",
        type: "long_text",
        answer: "Strategic planning in the morning, user research analysis, team collaboration sessions, and product roadmap refinement."
      },
      {
        title: "What workplace situations or tasks do you prefer to avoid?",
        type: "long_text",
        answer: "Micromanagement and endless meetings without clear outcomes or action items."
      },
      {
        title: "How do you prefer to learn and develop new skills?",
        type: "long_text",
        answer: "Through case studies, peer discussions, and hands-on experimentation with new tools and methodologies."
      },
      {
        title: "How do you prefer to receive feedback?",
        type: "long_text",
        answer: "I value honest, constructive feedback focused on growth and impact, delivered in regular one-on-one settings."
      }
    ];

    // Get N8N webhook URL from environment variable
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable not set');
      return new Response(JSON.stringify({
        error: 'N8N webhook URL not configured',
        hint: 'Set N8N_WEBHOOK_URL in Supabase Edge Function secrets'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Test data to send to N8N in the format it expects
    const testData = {
      user_id: "test-user-sjoerd-geurts",
      report_id: "test-report-" + Date.now(),
      access_code_id: "test-access-code",
      survey_id: "00000000-0000-0000-0000-000000000001",
      survey_responses: detailedSurveyData,
      created_at: new Date().toISOString(),
      processing_status: "test-run",
      test_mode: true
    };

    // Sending test data to N8N webhook

    // POST to N8N webhook
    const resp = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    // Response status logged in returned data

    if (!resp.ok) {
      const err = await resp.text();
      console.error("N8N webhook test error:", resp.status, err);
      return new Response(JSON.stringify({
        error: `N8N webhook test failed: ${resp.status} ${resp.statusText}`,
        details: err
      }), { 
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle both JSON and text responses from N8N
    let result;
    const responseText = await resp.text();

    try {
      // Try to parse as JSON first
      result = JSON.parse(responseText);
    } catch (parseError) {
      // If it's not JSON, treat it as a text response
      result = { 
        message: responseText,
        raw_response: responseText,
        type: 'text_response'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Test data sent to N8N workflow successfully',
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
