// deliver-section — fast path for chat section delivery.
//
// Replaces the WF5.2 Atlas Agent for the most common turn type: a clean
// "Continue to next section" advance with no preceding discussion. Pulls the
// section content from `report_sections`, renders it deterministically with
// the same boilerplate the agent uses, writes the message to
// `n8n_chat_histories` so the agent's memory stays in sync, and (optionally)
// closes feedback for the section being left behind.
//
// Inputs:
//   {
//     report_id:      string (uuid),
//     section_type:   one of approach|strengths|development|values|
//                     top_career_1|top_career_2|top_career_3|
//                     runner_ups|outside_box|dream_jobs,
//     previous_section_type?: same set — if provided, the row(s) for that
//                     section get fb_unified-equivalent text written
//                     (only when fb_status IS NOT TRUE).
//   }
//
// Output: { content: string }   — the rendered markdown shown in chat
//
// Auth: same loose pattern as other Atlas edge functions. CORS is locked
// down via _shared/cors.ts.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  renderSection,
  buildAiChatMessage,
  buildHumanChatMessage,
  type ReportSectionRow,
} from './renderer.ts';
import type { SectionType } from './boilerplate.ts';

// Inlined CORS helper — same logic as supabase/functions/_shared/cors.ts.
// Inlined so the deploy bundle is self-contained.
const ALLOWED_ORIGINS = [
  'https://cairnly.io',
  'https://www.cairnly.io',
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

function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}

function errorResponse(message: string, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const VALID_SECTION_TYPES = new Set<SectionType>([
  'approach',
  'strengths',
  'development',
  'values',
  'top_career_1',
  'top_career_2',
  'top_career_3',
  'runner_ups',
  'outside_box',
  'dream_jobs',
]);

const CANONICAL_NO_DISCUSSION_FEEDBACK =
  'User confirmed accuracy, no changes needed.';

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  let body: {
    report_id?: string;
    section_type?: string;
    previous_section_type?: string;
    user_message?: string;
    session_id?: string;
    user_id?: string;
    skip_history_user_write?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const {
    report_id,
    section_type,
    previous_section_type,
    user_message,
    session_id,
    user_id,
    skip_history_user_write,
  } = body;

  if (!report_id || typeof report_id !== 'string') {
    return errorResponse('report_id required', 400, corsHeaders);
  }
  if (!section_type || !VALID_SECTION_TYPES.has(section_type as SectionType)) {
    return errorResponse(
      `Invalid section_type. Must be one of: ${[...VALID_SECTION_TYPES].join(', ')}`,
      400,
      corsHeaders,
    );
  }
  if (
    previous_section_type !== undefined &&
    !VALID_SECTION_TYPES.has(previous_section_type as SectionType)
  ) {
    return errorResponse(
      'Invalid previous_section_type',
      400,
      corsHeaders,
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Fetch the section row(s) we need to render.
  const { data: rows, error: fetchErr } = await supabase
    .from('report_sections')
    .select(
      'section_type, order_number, title, alternate_titles, company_size_type, content, score',
    )
    .eq('report_id', report_id)
    .eq('section_type', section_type)
    .order('order_number', { ascending: true });

  if (fetchErr) {
    console.error('[deliver-section] fetch error:', fetchErr);
    return errorResponse('Failed to load section content', 500, corsHeaders);
  }
  if (!rows || rows.length === 0) {
    return errorResponse(
      `No content found for section_type=${section_type}`,
      404,
      corsHeaders,
    );
  }

  // 2. Render to markdown.
  let rendered: string;
  try {
    rendered = renderSection(section_type as SectionType, rows as ReportSectionRow[]);
  } catch (e) {
    console.error('[deliver-section] render error:', e);
    return errorResponse('Failed to render section', 500, corsHeaders);
  }

  // 3a. Write user + AI messages to n8n_chat_histories (agent memory).
  //     session_id here = bare report_id (what the agent's Postgres memory
  //     node uses). When the agent is handling this advance in parallel
  //     (post-discussion case), it'll write the user msg itself via
  //     langchain — skip our write to avoid a duplicate.
  const histRows: Array<{ session_id: string; message: unknown }> = [];
  if (user_message && typeof user_message === 'string' && !skip_history_user_write) {
    histRows.push({
      session_id: report_id,
      message: buildHumanChatMessage(user_message),
    });
  }
  histRows.push({
    session_id: report_id,
    message: buildAiChatMessage(rendered),
  });

  const { error: writeErr } = await supabase
    .from('n8n_chat_histories')
    .insert(histRows);

  if (writeErr) {
    console.error('[deliver-section] history write failed:', writeErr);
  }

  // 3b. Write user + AI messages to chat_messages (UI persistence).
  //     This is the table the frontend reads on page load. Server-side
  //     write here makes persistence atomic with the API response — if
  //     the user refreshes mid-flight, they still see the bot delivery
  //     after reload. session_id and user_id required for the row.
  if (session_id && user_id) {
    const chatRows: Array<{
      session_id: string;
      report_id: string;
      user_id: string;
      sender: 'user' | 'bot';
      content: string;
    }> = [];
    if (user_message && typeof user_message === 'string') {
      chatRows.push({
        session_id,
        report_id,
        user_id,
        sender: 'user',
        content: user_message,
      });
    }
    chatRows.push({
      session_id,
      report_id,
      user_id,
      sender: 'bot',
      content: rendered,
    });

    const { error: chatWriteErr } = await supabase.from('chat_messages').insert(chatRows);
    if (chatWriteErr) {
      console.error('[deliver-section] chat_messages write failed:', chatWriteErr);
    }
  }

  // 4. Close feedback for the section being left behind, if any.
  //    Equivalent to fb_unified writing the canonical "no discussion"
  //    string. Skip rows where the agent has already written real
  //    feedback (fb_status = true). Match NULL or FALSE explicitly:
  //    `.neq('fb_status', true)` does NOT match NULL rows because
  //    Postgres NULL comparisons always return NULL (falsy), so the
  //    initial NULL state would be silently skipped.
  if (previous_section_type) {
    const { error: fbErr } = await supabase
      .from('report_sections')
      .update({
        feedback: CANONICAL_NO_DISCUSSION_FEEDBACK,
        fb_status: true,
      })
      .eq('report_id', report_id)
      .eq('section_type', previous_section_type)
      .or('fb_status.is.null,fb_status.eq.false');

    if (fbErr) {
      // Same policy: log, don't fail the request.
      console.error('[deliver-section] fb_unified write failed:', fbErr);
    }
  }

  return new Response(JSON.stringify({ content: rendered }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
