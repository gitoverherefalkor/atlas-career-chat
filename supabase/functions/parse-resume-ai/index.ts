import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
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
    console.log('Prompt length:', prompt?.length || 0);

    // Build the full prompt - include both the system instruction and the user prompt
    const fullPrompt = `${prompt}

IMPORTANT: You must respond with ONLY a valid JSON object. No markdown, no code blocks, no explanations. Just the raw JSON starting with { and ending with }`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      }
    };

    console.log('Sending request to Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    // Check for safety blocks or other issues
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      console.error('Response blocked by safety filters');
      throw new Error('Response blocked by safety filters');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('No text in response. Candidates:', JSON.stringify(data.candidates));
      throw new Error('No response from Gemini');
    }

    console.log('AI raw response (first 500 chars):', aiResponse.substring(0, 500));

    // Parse the JSON response - handle various formats
    let extractedData;
    try {
      let jsonString = aiResponse.trim();

      // Remove markdown code blocks if present
      const jsonBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonString = jsonBlockMatch[1];
      } else {
        // Try to extract JSON object directly { ... }
        const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }

      console.log('Attempting to parse JSON (first 200 chars):', jsonString.substring(0, 200));
      extractedData = JSON.parse(jsonString.trim());
      console.log('JSON parsed successfully. Keys:', Object.keys(extractedData));
    } catch (parseError) {
      console.error('JSON parse failed. Raw response:', aiResponse);
      console.error('Parse error:', parseError.message);
      throw new Error('AI returned invalid JSON: ' + parseError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedData,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in parse-resume-ai function:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
