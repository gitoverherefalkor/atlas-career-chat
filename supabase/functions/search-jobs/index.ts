
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight, checkRateLimit, errorResponse } from "../_shared/cors.ts";

// Cache duration: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

serve(async (req) => {
  // Handle CORS preflight
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 10 requests per minute per IP
  const rateLimited = checkRateLimit(req, 10, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const { career_title, country_code, location, alternate_titles } = await req.json();

    if (!career_title || !country_code) {
      return errorResponse('career_title and country_code are required', 400, corsHeaders);
    }

    // Initialize Supabase client with service role for cache access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY')!
    );

    // Normalize search query for cache lookup
    const searchQuery = career_title.toLowerCase().trim();
    const countryNormalized = country_code.toLowerCase().trim();

    // Check cache first
    const { data: cached } = await supabase
      .from('job_search_cache')
      .select('results, result_count, fetched_at')
      .eq('search_query', searchQuery)
      .eq('country_code', countryNormalized)
      .gt('expires_at', new Date().toISOString())
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({
        jobs: cached.results,
        total_count: cached.result_count,
        cached: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache miss — call n8n webhook
    const n8nWebhookUrl = Deno.env.get('N8N_JOB_SEARCH_WEBHOOK_URL');

    if (!n8nWebhookUrl) {
      console.error('N8N_JOB_SEARCH_WEBHOOK_URL not set');
      return errorResponse('Job search is temporarily unavailable.', 503, corsHeaders);
    }

    // Validate webhook URL
    try {
      const parsed = new URL(n8nWebhookUrl);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
    } catch {
      console.error('N8N_JOB_SEARCH_WEBHOOK_URL is not a valid URL');
      return errorResponse('Job search is temporarily unavailable.', 503, corsHeaders);
    }

    // Call n8n with 60-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let resp: Response;
    try {
      resp = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career_title,
          alternate_titles: alternate_titles || [],
          country_code: countryNormalized,
          location: location || '',
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      const isTimeout = fetchError instanceof DOMException && fetchError.name === 'AbortError';
      console.error('n8n webhook error:', fetchError);
      return errorResponse(
        isTimeout ? 'Job search timed out. Please try again.' : 'Job search failed. Please try again.',
        isTimeout ? 504 : 502,
        corsHeaders
      );
    }
    clearTimeout(timeout);

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('n8n returned error:', resp.status, errBody);
      return errorResponse('Job search failed. Please try again.', 502, corsHeaders);
    }

    const n8nResult = await resp.json();

    // Normalize: n8n should return { jobs: [...] } but handle variations
    const jobs = Array.isArray(n8nResult) ? n8nResult
      : Array.isArray(n8nResult.jobs) ? n8nResult.jobs
      : [];

    // Store in cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
    await supabase.from('job_search_cache').insert({
      search_query: searchQuery,
      country_code: countryNormalized,
      results: jobs,
      result_count: jobs.length,
      expires_at: expiresAt,
    });

    return new Response(JSON.stringify({
      jobs,
      total_count: jobs.length,
      cached: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-jobs function:', error);
    return errorResponse('An error occurred searching for jobs. Please try again.', 500, corsHeaders);
  }
});
