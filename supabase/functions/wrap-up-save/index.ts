// wrap-up-save — persist the user-approved Discussion Highlights to
// `report_sections` so they land in the formal report. The user just
// reviewed the extracted bullets in the WrapUpCard and optionally added
// an addendum (a "anything else you want flagged?" free-text field) plus
// any specific bot responses they bookmarked during the session for
// verbatim preservation.
//
// Inputs:
//   {
//     report_id: string (uuid),
//     highlights: string,        // markdown bullets from wrap-up-extract,
//                                // possibly edited by the user
//     addendum?: string | null,  // optional free-text the user added
//     saved_responses?: Array<{  // bot replies the user bookmarked inline
//       content: string,         // markdown body of the message
//       saved_at?: string | null // ISO timestamp the bookmark was set
//     }>,
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

  interface SavedResponseInput {
    content?: string;
    saved_at?: string | null;
  }

  let body: {
    report_id?: string;
    highlights?: string;
    addendum?: string | null;
    saved_responses?: SavedResponseInput[];
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const { report_id, highlights, addendum, saved_responses } = body;
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

  // Sanitize the saved-responses list. Each one is a verbatim bot reply
  // the user bookmarked in-chat. Cap individual length AND total count
  // so a runaway client can't blow up the row.
  const cleanedSaved: { content: string; saved_at: string | null }[] = [];
  if (Array.isArray(saved_responses)) {
    for (const entry of saved_responses.slice(0, 50)) {
      if (!entry || typeof entry.content !== 'string') continue;
      const c = entry.content.trim();
      if (!c) continue;
      cleanedSaved.push({
        content: c.slice(0, 8_000),
        saved_at:
          typeof entry.saved_at === 'string' && entry.saved_at.trim().length > 0
            ? entry.saved_at.trim().slice(0, 64)
            : null,
      });
    }
  }

  // Compose the final markdown stored on the section row. Order:
  //   1. Auto-extracted highlights (the LLM bullets).
  //   2. "Saved Responses" subsection — verbatim bot replies the user
  //      bookmarked inline. Preserves the deep-dive recipes that the
  //      summarizer would otherwise compress to a theme.
  //   3. Addendum — the user's own typed note from the wrap-up card.
  const parts: string[] = [trimmedHighlights];
  if (cleanedSaved.length > 0) {
    parts.push('\n\n##### Saved Responses\n');
    cleanedSaved.forEach((s, i) => {
      parts.push(`\n\n**Saved response ${i + 1}**\n\n${s.content}`);
    });
  }
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

  // Flip the report from pending_review → completed so the dashboard
  // surfaces the Career Signature / Career Map / Personality Radar and
  // ReportDisplay, instead of the "Resume Chat" card. Scoped to the
  // pending_review state so we don't accidentally overwrite a 'failed'
  // or already-'completed' status (e.g. on a second wrap-up).
  const { error: statusErr } = await supabase
    .from('reports')
    .update({ status: 'completed' })
    .eq('id', report_id)
    .eq('status', 'pending_review');

  if (statusErr) {
    // Non-fatal: highlights are saved, the user can still see them on
    // the dashboard. Log and move on rather than blocking the response.
    console.error('[wrap-up-save] status update error:', statusErr);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
