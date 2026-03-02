import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreFlight, errorResponse, checkRateLimit } from "../_shared/cors.ts";

// Extract JSON from text, stripping markdown code blocks
function extractJson(text: string): string {
  let s = text.trim();

  // Strip markdown code blocks - handle ```json and ```
  s = s.replace(/^```json\s*/i, '');
  s = s.replace(/^```\s*/i, '');
  s = s.replace(/\s*```$/i, '');

  // Find JSON object boundaries
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1);
  }

  // Clean problematic characters
  s = s.replace(/[\u201C\u201D]/g, '"');  // smart double quotes
  s = s.replace(/[\u2018\u2019]/g, "'");  // smart single quotes
  s = s.replace(/[\r\n\t]+/g, ' ');       // newlines/tabs to spaces
  s = s.replace(/\s+/g, ' ');             // collapse whitespace

  return s.trim();
}

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: 5 resume parses per minute per IP (Gemini API costs)
  const rateLimited = checkRateLimit(req, 5, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const { resumeText, prompt } = await req.json();

    if (!resumeText) {
      return errorResponse('No resume text provided', 400, corsHeaders);
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return errorResponse('Resume parsing is temporarily unavailable.', 500, corsHeaders);
    }

    console.log('Processing resume with Gemini 2.5 Flash, text length:', resumeText.length);

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      return errorResponse('Resume parsing failed. Please try again.', 500, corsHeaders);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return errorResponse('Resume content could not be processed. Please try a different file.', 400, corsHeaders);
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('No text in Gemini response');
      return errorResponse('Resume parsing returned no results. Please try again.', 500, corsHeaders);
    }

    // Parse JSON - with JSON mode this should be clean, but handle edge cases
    let extractedData;
    try {
      extractedData = JSON.parse(aiResponse);
    } catch (e1) {
      const cleaned = extractJson(aiResponse);
      extractedData = JSON.parse(cleaned);
    }

    return new Response(
      JSON.stringify({ success: true, extractedData, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in parse-resume-ai:', error);
    return errorResponse('Failed to parse resume. Please try again.', 400, corsHeaders);
  }
});
