
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
    console.log('Test survey integration function called');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY')!
    );

    // Test response data
    const testResponse = {
      "personal_name": "Alex Chen",
      "personal_age": 28,
      "personal_education": "Bachelor's Degree",
      "personal_experience": 5,
      "personal_location": "San Francisco, CA",
      "current_role": "Software Engineer",
      "current_industry": "Technology",
      "current_company_size": "Large Corporation (1000+ employees)",
      "current_satisfaction": 7,
      "current_challenges": "Limited growth opportunities and repetitive tasks",
      "skills_technical": ["Programming", "System Design", "Database Management", "Cloud Computing"],
      "skills_soft": ["Problem Solving", "Analytical Thinking", "Team Collaboration"],
      "skills_rating_communication": 8,
      "skills_rating_leadership": 6,
      "skills_rating_creativity": 9,
      "skills_rating_analytical": 10,
      "skills_rating_interpersonal": 7,
      "interests_primary": ["Technology", "Innovation", "Continuous Learning"],
      "interests_activities": "Building side projects, contributing to open source, attending tech meetups",
      "values_ranking": ["Innovation", "Growth Opportunities", "Work-Life Balance", "High Salary", "Job Security", "Recognition", "Autonomy", "Social Impact"],
      "values_work_environment": "Collaborative and innovative",
      "goals_short_term": "Become a senior software engineer and lead technical projects",
      "goals_long_term": "Start my own tech company or become a CTO",
      "goals_industries_interested": ["Technology", "Fintech", "Healthcare Tech"],
      "goals_preferred_role_type": "Individual contributor with some leadership",
      "goals_work_preference": "Hybrid",
      "personality_work_style": "I prefer working independently on complex problems but enjoy collaborating during design phases",
      "personality_decision_making": "Data-driven with careful analysis",
      "personality_stress_management": "I break down problems into smaller parts and take short breaks when needed",
      "personality_motivation": "Learning new technologies and solving challenging problems",
      "personality_team_role": "The technical expert who provides innovative solutions",
      "additional_ideal_day": "Working on challenging technical problems, learning new frameworks, mentoring junior developers",
      "additional_avoid": "Repetitive manual tasks and excessive meetings",
      "additional_learning_style": "Hands-on experimentation and online courses",
      "additional_feedback": "I appreciate direct, constructive feedback focused on technical growth"
    };

    // First ensure survey exists
    const surveyId = "00000000-0000-0000-0000-000000000001";
    
    const { data: existingSurvey, error: surveyCheckError } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', surveyId)
      .maybeSingle();
    
    if (!existingSurvey && (!surveyCheckError || surveyCheckError.code === 'PGRST116')) {
      console.log('Creating survey...');
      const { error: createError } = await supabase
        .from('surveys')
        .insert({
          id: surveyId,
          title: "Atlas Career Assessment"
        });
      
      if (createError) {
        console.error('Error creating survey:', createError);
        throw createError;
      }
      console.log('Survey created successfully');
    } else if (surveyCheckError) {
      console.error('Error checking survey:', surveyCheckError);
      throw surveyCheckError;
    } else {
      console.log('Survey already exists');
    }

    // Insert test response
    console.log('Inserting test response...');
    const { data, error } = await supabase
      .from('answers')
      .insert({
        survey_id: surveyId,
        payload: testResponse
      })
      .select();

    if (error) {
      console.error('Error inserting test response:', error);
      throw error;
    }

    console.log('Test response inserted successfully:', data);
    console.log('Database trigger should now call downstream processing (n8n/payload webhook)');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test response submitted successfully',
      data: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-survey-integration function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
