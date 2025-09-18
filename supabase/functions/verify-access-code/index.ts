
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
    console.log('Verify access code function called');
    
    const { code } = await req.json();
    
    if (!code) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Access code is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Verifying access code:', code);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY')!
    );

    // Check if access code exists and is valid
    const { data: accessCode, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !accessCode) {
      console.log('Access code not found:', code);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Access code not found. Please check your code or purchase a new one.',
        needsPurchase: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if expired
    if (new Date(accessCode.expires_at) < new Date()) {
      console.log('Access code expired:', code);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Access code has expired. Please purchase a new one.',
        needsPurchase: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already used (usage_count >= max_usage)
    if (accessCode.usage_count >= accessCode.max_usage) {
      console.log('Access code already used:', code);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Access code has already been used. Please purchase a new one.',
        needsPurchase: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Access code valid:', code);
    return new Response(JSON.stringify({ 
      valid: true, 
      accessCode: {
        id: accessCode.id,
        code: accessCode.code,
        survey_type: accessCode.survey_type,
        remaining_uses: accessCode.max_usage - accessCode.usage_count
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying access code:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'Failed to verify access code. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
