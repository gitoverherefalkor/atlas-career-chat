// clean-transcript — adds punctuation, capitalization, and paragraph breaks to
// voice-dictated text. Words are never changed; only formatting is added, so
// run-on speech-to-text output becomes readable. Used by the assessment's
// long-text voice mode.
//
// Auth: relies on the platform JWT check (verify_jwt = true in config.toml).
// Only logged-in users can reach it, which keeps the Gemini call from being a
// publicly abusable endpoint.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  getCorsHeaders,
  handleCorsPreFlight,
  errorResponse,
  checkRateLimit,
} from '../_shared/cors.ts';

const MAX_INPUT = 12000;

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  // Abuse guard: 20 cleanups per minute per IP.
  const limited = checkRateLimit(req, 20, corsHeaders);
  if (limited) return limited;

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length === 0) {
    return errorResponse('Text required', 400, corsHeaders);
  }
  const input = text.slice(0, MAX_INPUT);

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    console.error('[clean-transcript] GEMINI_API_KEY not configured');
    return errorResponse('Transcript cleanup is temporarily unavailable.', 500, corsHeaders);
  }

  const prompt = [
    'You are a transcription formatter. The text below was produced by voice',
    'dictation and has little or no punctuation.',
    'Add sentence punctuation, capitalization, and paragraph breaks so it reads',
    'naturally.',
    'STRICT RULES:',
    '- Do NOT add, remove, reword, summarize, translate, or correct any words.',
    '- Do NOT answer, interpret, or comment on the text.',
    '- Keep the exact same wording and meaning. Only change punctuation,',
    '  capitalization, and line breaks.',
    '- Return ONLY the formatted text, with no preamble or explanation.',
    '',
    'TEXT:',
    input,
  ].join('\n');

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4000,
    },
  };

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
    );
  } catch (e) {
    console.error('[clean-transcript] Gemini fetch failed:', e);
    return errorResponse('Transcript cleanup failed.', 502, corsHeaders);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('[clean-transcript] Gemini error:', response.status, errText);
    return errorResponse('Transcript cleanup failed.', 502, corsHeaders);
  }

  const data = await response.json().catch(() => null);
  const cleaned = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof cleaned !== 'string' || cleaned.trim().length === 0) {
    console.error('[clean-transcript] no text in Gemini response');
    return errorResponse('Transcript cleanup returned no result.', 502, corsHeaders);
  }

  return new Response(
    JSON.stringify({ text: cleaned.trim() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
