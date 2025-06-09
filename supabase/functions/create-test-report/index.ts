
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

    // Create a test report
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

    console.log('Test report created:', reportData.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test report created successfully',
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
