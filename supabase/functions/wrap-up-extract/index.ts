// wrap-up-extract — distill the chat conversation into 4-8 highlight
// bullets so the nuance from discussion (specific strategies, pivots,
// course corrections the user resonated with) survives into the final
// report instead of being trapped in a transcript no one re-reads.
//
// Triggered when the user clicks "All done, wrap up session" in the chat.
// Returns the highlights as markdown for the WrapUpCard to display. The
// user reviews, optionally adds an addendum, then commits via the sibling
// `wrap-up-save` function.
//
// Inputs:
//   {
//     report_id: string (uuid),
//   }
//
// Output: { highlights: string }   — markdown bullet list

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

// Strips markdown headings, html tags, separators — leaves only the
// text the user/agent actually said. Keeps the prompt compact.
function stripFormatting(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SYSTEM_PROMPT = `You distill a career-coaching chat conversation into a tight set of "Discussion Highlights" that will be added to the user's formal report.

Your job is to surface the things the formal report would otherwise lose: specific strategies the user found valuable, pivots in their thinking, custom angles the conversation produced, things they explicitly said resonated.

Rules:
- Return 4-8 bullets, no more.
- Each bullet starts with a bold lead phrase, then a clarifying sentence. Markdown format: "- **Lead phrase.** Clarifying sentence."
- Lead phrases are concrete and specific to THIS conversation — not generic. "Substack-corporate IP hybrid" beats "Content strategy ideas."
- Skip small talk, navigation messages ("ready to continue?"), and content that just restates the report.
- Skip anything the user pushed back on or rejected.
- Use second person ("you"). No em-dashes; use commas, colons, or parentheses.
- Output ONLY the bullet list. No intro, no outro, no headings.`;

interface ChatMessageRow {
  sender: 'user' | 'bot';
  content: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  let body: { report_id?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const { report_id } = body;
  if (!report_id || typeof report_id !== 'string') {
    return errorResponse('report_id required', 400, corsHeaders);
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    console.error('[wrap-up-extract] OPENAI_API_KEY not configured');
    return errorResponse('Server misconfigured', 500, corsHeaders);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Pull the full chat for this report. Order ascending so the LLM sees
  // the natural conversational flow.
  const { data: messages, error: msgErr } = await supabase
    .from('chat_messages')
    .select('sender, content, created_at')
    .eq('report_id', report_id)
    .order('created_at', { ascending: true })
    .returns<ChatMessageRow[]>();

  if (msgErr) {
    console.error('[wrap-up-extract] fetch chat_messages error:', msgErr);
    return errorResponse('Failed to load chat history', 500, corsHeaders);
  }
  if (!messages || messages.length === 0) {
    return errorResponse('No chat messages found for this report', 404, corsHeaders);
  }

  // Format the transcript compactly. Cap at ~80k chars (well under any
  // reasonable token ceiling). For exceptionally long sessions we drop
  // the oldest messages first — section delivery boilerplate adds up
  // quickly and the recent discussion is where the gold is anyway.
  const transcriptParts: string[] = [];
  for (const m of messages) {
    const role = m.sender === 'user' ? 'USER' : 'COACH';
    transcriptParts.push(`${role}: ${stripFormatting(m.content)}`);
  }
  let transcript = transcriptParts.join('\n\n');
  const MAX_CHARS = 80_000;
  if (transcript.length > MAX_CHARS) {
    transcript = transcript.slice(transcript.length - MAX_CHARS);
  }

  const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Distill this conversation into Discussion Highlights:\n\n${transcript}`,
        },
      ],
    }),
  });

  if (!openaiResp.ok) {
    const errText = await openaiResp.text();
    console.error('[wrap-up-extract] OpenAI error:', openaiResp.status, errText);
    return errorResponse('Failed to generate highlights', 502, corsHeaders);
  }

  const json = await openaiResp.json();
  const highlights = json?.choices?.[0]?.message?.content?.trim() ?? '';
  if (!highlights) {
    return errorResponse('Empty highlights returned', 502, corsHeaders);
  }

  return new Response(JSON.stringify({ highlights }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
