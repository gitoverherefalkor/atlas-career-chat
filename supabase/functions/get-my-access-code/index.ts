import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/cors.ts";

// Returns the access code claimed by the calling user, identified from their
// JWT. Lets the Dashboard and Assessment page recover a logged-in user's
// assessment with no localStorage — e.g. a fresh browser or incognito.
serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY')!
    );

    // Identify the caller from their JWT (gateway verify_jwt is off; we
    // validate the token here so an anon/publishable key simply yields no user).
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ found: false });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ found: false });

    // Most recently claimed access code for this user.
    const { data: accessCode } = await supabase
      .from('access_codes')
      .select('id, code, survey_type, max_usage, usage_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!accessCode) return json({ found: false });

    return json({
      found: true,
      accessCode: {
        id: accessCode.id,
        code: accessCode.code,
        survey_type: accessCode.survey_type,
        remaining_uses: accessCode.max_usage - accessCode.usage_count,
      },
    });
  } catch (error) {
    console.error('Error in get-my-access-code:', error);
    return json({ found: false, error: 'Lookup failed' }, 500);
  }
});
