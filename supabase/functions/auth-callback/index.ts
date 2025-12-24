import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://www.atlas-assessments.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const url = new URL(req.url);

  // Get the authorization code from query params (PKCE flow)
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  console.log("Auth callback received. Code present:", !!code, "Error:", error);

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return Response.redirect(
      `${FRONTEND_URL}/auth?error=${encodeURIComponent(errorDescription || error)}`,
      302
    );
  }

  // If no code, redirect back with error
  if (!code) {
    console.error("No authorization code received");
    return Response.redirect(
      `${FRONTEND_URL}/auth?error=${encodeURIComponent("No authorization code received")}`,
      302
    );
  }

  try {
    // Create Supabase client with service role for server-side operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Exchange the code for a session
    // We need to use the anon key client for this as it's the auth flow
    // Note: Using SB_ANON_KEY because SUPABASE_ prefix is reserved
    const supabaseAnonKey = Deno.env.get("SB_ANON_KEY")!;
    const supabaseAuth = createClient(SUPABASE_URL, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        flowType: 'pkce',
      },
    });

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabaseAuth.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return Response.redirect(
        `${FRONTEND_URL}/auth?error=${encodeURIComponent(exchangeError.message)}`,
        302
      );
    }

    if (!data.session) {
      console.error("No session returned from code exchange");
      return Response.redirect(
        `${FRONTEND_URL}/auth?error=${encodeURIComponent("Failed to create session")}`,
        302
      );
    }

    console.log("Session created for user:", data.user?.email);

    // Check if profile exists, create if not
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single();

    if (!existingProfile) {
      const provider = data.user?.app_metadata?.provider || 'oauth';
      const fullName = data.user?.user_metadata?.full_name || '';
      const nameParts = fullName.split(' ');

      await supabaseAdmin.from('profiles').insert({
        id: data.user!.id,
        email: data.user!.email!,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        auth_provider: provider,
      });
      console.log("Created new profile for user");
    }

    // Redirect to frontend with tokens in hash
    // The frontend will store these directly without needing to call the API (avoiding CORS)
    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;
    const expiresIn = data.session.expires_in;
    const tokenType = data.session.token_type || 'bearer';

    // Build the redirect URL with tokens in hash (same format Supabase uses)
    const hashParams = new URLSearchParams({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: String(expiresIn),
      token_type: tokenType,
      type: 'signup', // or 'login' - this tells the frontend it's an auth callback
    });

    const redirectUrl = `${FRONTEND_URL}/auth/confirm#${hashParams.toString()}`;

    console.log("Redirecting to frontend with tokens in hash");
    return Response.redirect(redirectUrl, 302);

  } catch (err) {
    console.error("Unexpected error in auth callback:", err);
    return Response.redirect(
      `${FRONTEND_URL}/auth?error=${encodeURIComponent("An unexpected error occurred")}`,
      302
    );
  }
});
