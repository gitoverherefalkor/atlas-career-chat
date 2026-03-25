
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getCorsHeaders, handleCorsPreFlight, checkRateLimit } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 5 attempts per minute per IP (stricter than verify — this creates users)
  const rateLimited = checkRateLimit(req, 5, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const { email, password, firstName, lastName, accessCode } = await req.json();

    // --- Input validation ---

    if (!email || !password || !firstName || !lastName || !accessCode) {
      return new Response(JSON.stringify({
        error: 'All fields are required: email, password, firstName, lastName, accessCode'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = accessCode.trim().toUpperCase();

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return new Response(JSON.stringify({
        error: 'Please enter a valid email address.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({
        error: 'Password must be at least 8 characters long.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Initialize Supabase with service role ---

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY')!
    );

    // --- Verify access code (same checks as verify-access-code) ---

    console.log('Signup with access code requested');

    const { data: codeRecord, error: codeError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', trimmedCode)
      .single();

    if (codeError || !codeRecord) {
      return new Response(JSON.stringify({
        error: 'Access code not found. Please check your code or purchase a new one.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (codeRecord.is_active === false) {
      return new Response(JSON.stringify({
        error: 'This access code has been deactivated. Please contact support.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        error: 'Access code has expired. Please purchase a new one.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (codeRecord.usage_count >= codeRecord.max_usage) {
      return new Response(JSON.stringify({
        error: 'Access code has already been used. Please purchase a new one.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Create pre-verified user ---

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        access_code: trimmedCode
      }
    });

    if (createError) {
      console.error('User creation error:', createError.message);

      // Supabase returns this when the email is already registered
      if (createError.message?.includes('already been registered') ||
          createError.message?.includes('already exists') ||
          createError.message?.includes('unique constraint')) {
        return new Response(JSON.stringify({
          error: 'An account with this email already exists. Please sign in instead.'
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        error: 'Failed to create account. Please try again.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User created successfully:', newUser.user?.id);

    return new Response(JSON.stringify({
      success: true,
      userId: newUser.user?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create account. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
