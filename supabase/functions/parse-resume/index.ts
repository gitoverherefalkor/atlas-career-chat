
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file uploaded');
    }

    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Read file content as text (for PDF we'd need more sophisticated parsing)
    let fileContent = '';
    
    if (file.type === 'application/pdf') {
      // For now, we'll let the user know PDF parsing needs additional setup
      // In production, you'd want to use a PDF parsing library
      throw new Error('PDF parsing not yet implemented. Please use Word documents for now.');
    } else {
      // Handle Word documents and plain text
      fileContent = await file.text();
    }

    // Use OpenAI to extract structured data from resume
    const prompt = `
You are a professional resume parser. Extract the following information from this resume and return it as a JSON object with these exact fields:

{
  "personal_info": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "professional_summary": "string",
  "current_role": {
    "title": "string",
    "company": "string",
    "duration": "string"
  },
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string", 
      "description": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string"
    }
  ],
  "skills": ["array of skills"],
  "industries": ["array of industries worked in"],
  "key_achievements": ["array of key achievements"]
}

Only return the JSON object, no additional text. If any field is not available, use null or an empty array as appropriate.

Resume content:
${fileContent}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional resume parser that extracts structured data from resumes and returns valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    console.log('OpenAI extracted text:', extractedText);

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Failed to parse resume data');
    }

    console.log('Parsed resume data:', extractedData);

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
      message: 'Resume processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
