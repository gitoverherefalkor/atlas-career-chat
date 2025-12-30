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

    console.log('Processing resume with Gemini, text length:', resumeText.length);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a precise resume parser that extracts structured data from resumes. Always return valid JSON only, no explanations.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    console.log('AI raw response:', aiResponse);

    // Parse the JSON response - handle various formats Gemini might return
    let extractedData;
    try {
      let jsonString = aiResponse.trim();

      // Remove markdown code blocks if present (various formats)
      // Handle ```json\n...\n```
      const jsonBlockMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonString = jsonBlockMatch[1];
      } else {
        // Handle ```\n...\n```
        const codeBlockMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1];
        } else {
          // Try to extract JSON object directly { ... }
          const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            jsonString = jsonObjectMatch[0];
          }
        }
      }

      console.log('Cleaned JSON string:', jsonString.substring(0, 200));
      extractedData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON. Raw response:', aiResponse);
      console.error('Parse error:', parseError.message);
      throw new Error('AI returned invalid JSON: ' + parseError.message);
    }

    console.log('AI parsed data:', extractedData);

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
    console.error('Error in parse-resume-ai function:', error);

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
