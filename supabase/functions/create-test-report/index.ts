
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create test report function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Look for user with email sjn.geurts@gmail.com
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'sjn.geurts@gmail.com')
      .maybeSingle();

    let userId;
    if (profileData) {
      userId = profileData.id;
      console.log('Found user ID:', userId);
    } else {
      console.log('User not found, creating test user profile');
      // Create a test user profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'sjn.geurts@gmail.com',
          first_name: 'Sjoerd',
          last_name: 'Geurts'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test profile:', createError);
        userId = '00000000-0000-0000-0000-000000000001'; // Use fallback
      } else {
        userId = newProfile.id;
      }
    }

    // Create a test report with COMPLETED status and sample sections
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        title: 'Test Career Assessment Report',
        status: 'completed',
        payload: {
          personal_name: "Sjoerd Geurts",
          test: true,
          created_for: "Dashboard testing"
        }
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating test report:', reportError);
      throw reportError;
    }

    // Create sample report sections
    const sampleSections = [
      {
        report_id: reportData.id,
        section_type: 'personality_overview',
        content: 'This is a test personality overview section. You are a visionary leader with strong organizational skills.'
      },
      {
        report_id: reportData.id,
        section_type: 'career_recommendations',
        content: 'Based on your profile, we recommend exploring roles in AI consulting, entrepreneurship, and clean technology.'
      },
      {
        report_id: reportData.id,
        section_type: 'development_areas',
        content: 'Focus on developing delegation skills and work-life balance strategies to enhance your effectiveness.'
      }
    ];

    const { error: sectionsError } = await supabase
      .from('report_sections')
      .insert(sampleSections);

    if (sectionsError) {
      console.error('Error creating test sections:', sectionsError);
      // Don't throw here, report is still valid without sections
    }

    console.log('Test report created:', reportData.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test report created successfully with sample sections',
      report_id: reportData.id,
      user_id: userId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-test-report function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
