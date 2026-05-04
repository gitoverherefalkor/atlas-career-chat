// wrap-up-save — persist the user-approved Discussion Highlights to
// `report_sections` so they land in the formal report. The user just
// reviewed the extracted bullets in the WrapUpCard and optionally added
// an addendum (a "anything else you want flagged?" free-text field).
//
// Inputs:
//   {
//     report_id: string (uuid),
//     highlights: string,        // markdown bullets from wrap-up-extract,
//                                // possibly edited by the user
//     addendum?: string | null,  // optional free-text the user added
//   }
//
// Output: { ok: true }
//
// Idempotent: if a `chat_highlights` row already exists for this report,
// the new submission overwrites it. Lets users hit "Save & Close" twice
// without producing a duplicate row in the report.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://atlas-assessments.com',
  'https://www.atlas-assessments.com',
];
const DEV_ORIGIN_PATTERN = /^http:\/\/localhost(:\d+)?$/;

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) || DEV_ORIGIN_PATTERN.test(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function errorResponse(message: string, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  let body: { report_id?: string; highlights?: string; addendum?: string | null };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const { report_id, highlights, addendum } = body;
  if (!report_id || typeof report_id !== 'string') {
    return errorResponse('report_id required', 400, corsHeaders);
  }
  if (!highlights || typeof highlights !== 'string' || highlights.trim().length === 0) {
    return errorResponse('highlights required', 400, corsHeaders);
  }

  const trimmedHighlights = highlights.trim().slice(0, 8_000);
  const trimmedAddendum =
    typeof addendum === 'string' && addendum.trim().length > 0
      ? addendum.trim().slice(0, 4_000)
      : null;

  // Compose the final markdown stored on the section row. The addendum
  // (if present) gets its own subsection so it's clearly the user's own
  // words, not part of the extracted highlights.
  const parts: string[] = [trimmedHighlights];
  if (trimmedAddendum) {
    parts.push(`\n\n##### Also flagged by you\n\n${trimmedAddendum}`);
  }
  const content = parts.join('');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Upsert: drop any existing chat_highlights for this report, then write
  // a fresh one. Same delete-then-insert pattern submit-chapter-feedback
  // uses; lets the user re-run wrap-up if they want to redo it.
  const { error: delErr } = await supabase
    .from('report_sections')
    .delete()
    .eq('report_id', report_id)
    .eq('section_type', 'chat_highlights');

  if (delErr) {
    console.error('[wrap-up-save] delete error:', delErr);
    return errorResponse('Failed to clear previous highlights', 500, corsHeaders);
  }

  const { error: insErr } = await supabase.from('report_sections').insert({
    report_id,
    section_type: 'chat_highlights',
    title: '<h3>Discussion Highlights</h3>',
    content,
    fb_status: true,
  });

  if (insErr) {
    console.error('[wrap-up-save] insert error:', insErr);
    return errorResponse('Failed to save highlights', 500, corsHeaders);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
