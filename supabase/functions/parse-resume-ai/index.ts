import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeText, prompt } = await req.json();

    if (!resumeText) {
      throw new Error('No resume text provided');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Processing resume with Gemini 2.5 Flash');
    console.log('Resume text length:', resumeText.length);

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

    console.log('Sending request to Gemini with JSON mode...');

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
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Response blocked by safety filters');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('No text in response:', JSON.stringify(data.candidates));
      throw new Error('No response from Gemini');
    }

    console.log('AI response (first 500 chars):', aiResponse.substring(0, 500));

    // Parse JSON - with JSON mode this should be clean, but handle edge cases
    let extractedData;
    try {
      extractedData = JSON.parse(aiResponse);
    } catch (e1) {
      console.log('Direct parse failed, extracting JSON...');
      const cleaned = extractJson(aiResponse);
      console.log('Cleaned JSON (first 300 chars):', cleaned.substring(0, 300));
      extractedData = JSON.parse(cleaned);
    }

    console.log('Parsed successfully. Keys:', Object.keys(extractedData));

    return new Response(
      JSON.stringify({ success: true, extractedData, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message, timestamp: new Date().toISOString() }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
