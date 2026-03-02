
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getCorsHeaders, handleCorsPreFlight, errorResponse, checkRateLimit } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 10 attempts per minute per IP (prevent brute-force code guessing)
  const rateLimited = checkRateLimit(req, 10, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
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

    // Don't log the actual access code — just that a verification was attempted
    console.log('Access code verification requested');

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
      return new Response(JSON.stringify({
        valid: false,
        error: 'Access code not found. Please check your code or purchase a new one.',
        needsPurchase: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if code is active
    if (accessCode.is_active === false) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'This access code has been deactivated. Please contact support.',
        needsPurchase: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if expired (only if expires_at is set)
    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
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
      return new Response(JSON.stringify({
        valid: false,
        error: 'Access code has already been used. Please purchase a new one.',
        needsPurchase: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
