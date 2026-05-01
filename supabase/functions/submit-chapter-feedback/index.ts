// submit-chapter-feedback — persist a structured chapter feedback response
// from the modal that appears at the values → Chapter 2 transition.
//
// Stored as a row in `report_sections` with section_type='chapter_1_feedback',
// content = JSON-encoded structure. fb_status=true so downstream workflows
// can pick it up alongside per-section feedback.
//
// Inputs:
//   {
//     report_id: string (uuid),
//     feedback: {
//       quality: string[],         // multi-select chips
//       length: string | null,     // single-select
//       strongest_subsection: string | null,
//       weakest_subsection: string | null,
//       free_text: string | null,
//     }
//   }
//
// Output: { ok: true }
//
// Idempotent: if a chapter_1_feedback row already exists for this report,
// the new submission overwrites it. Lets users tweak their answer if they
// hit the modal twice somehow.

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

interface ChapterFeedback {
  quality?: string[];
  length?: string | null;
  strongest_subsection?: string | null;
  weakest_subsection?: string | null;
  free_text?: string | null;
}

const VALID_QUALITY = new Set([
  'insightful',
  'just_right',
  'too_obvious',
  'off_the_mark',
]);
const VALID_LENGTH = new Set(['too_long', 'just_right', 'too_short']);
const VALID_SUBSECTION = new Set([
  'approach',
  'strengths',
  'development',
  'values',
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  let body: { report_id?: string; feedback?: ChapterFeedback };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const { report_id, feedback } = body;
  if (!report_id || typeof report_id !== 'string') {
    return errorResponse('report_id required', 400, corsHeaders);
  }
  if (!feedback || typeof feedback !== 'object') {
    return errorResponse('feedback object required', 400, corsHeaders);
  }

  // Sanitize + validate. Keep only known values; anything else gets dropped.
  const cleaned: ChapterFeedback = {
    quality: Array.isArray(feedback.quality)
      ? feedback.quality.filter((q) => VALID_QUALITY.has(q))
      : [],
    length: typeof feedback.length === 'string' && VALID_LENGTH.has(feedback.length)
      ? feedback.length
      : null,
    strongest_subsection:
      typeof feedback.strongest_subsection === 'string' &&
      VALID_SUBSECTION.has(feedback.strongest_subsection)
        ? feedback.strongest_subsection
        : null,
    weakest_subsection:
      typeof feedback.weakest_subsection === 'string' &&
      VALID_SUBSECTION.has(feedback.weakest_subsection)
        ? feedback.weakest_subsection
        : null,
    free_text:
      typeof feedback.free_text === 'string' && feedback.free_text.trim().length > 0
        ? feedback.free_text.trim().slice(0, 2000)
        : null,
  };

  // Require at least one signal so the modal can't be submitted empty.
  const hasSignal =
    (cleaned.quality?.length ?? 0) > 0 ||
    cleaned.length !== null ||
    cleaned.strongest_subsection !== null ||
    cleaned.weakest_subsection !== null ||
    cleaned.free_text !== null;
  if (!hasSignal) {
    return errorResponse('Submit at least one feedback field', 400, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const payload = {
    report_id,
    section_type: 'chapter_1_feedback',
    content: JSON.stringify({
      ...cleaned,
      submitted_at: new Date().toISOString(),
    }),
    fb_status: true,
  };

  // Upsert: either insert a new row or overwrite the existing chapter
  // feedback for this report. The existing row's primary key (id) is
  // unknown, so we delete-then-insert in a single round-trip pattern.
  const { error: delErr } = await supabase
    .from('report_sections')
    .delete()
    .eq('report_id', report_id)
    .eq('section_type', 'chapter_1_feedback');

  if (delErr) {
    console.error('[submit-chapter-feedback] delete error:', delErr);
    return errorResponse('Failed to clear previous feedback', 500, corsHeaders);
  }

  const { error: insErr } = await supabase
    .from('report_sections')
    .insert(payload);

  if (insErr) {
    console.error('[submit-chapter-feedback] insert error:', insErr);
    return errorResponse('Failed to save feedback', 500, corsHeaders);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
