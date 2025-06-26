
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

    // Step 1: Extract basic structured data
    const basicExtractionPrompt = `
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
  "key_achievements": ["array of key achievements"]
}

Only return the JSON object, no additional text. If any field is not available, use null or an empty array as appropriate.

Resume content:
${fileContent}
`;

    const basicResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
          { role: 'user', content: basicExtractionPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!basicResponse.ok) {
      throw new Error(`OpenAI API error: ${basicResponse.statusText}`);
    }

    const basicData = await basicResponse.json();
    const basicExtractedText = basicData.choices[0].message.content;
    
    let basicExtractedData;
    try {
      basicExtractedData = JSON.parse(basicExtractedText);
    } catch (parseError) {
      console.error('Failed to parse basic extraction response as JSON:', parseError);
      throw new Error('Failed to parse basic resume data');
    }

    // Step 2: Intelligent analysis with GPT-4o for complex deductions
    const intelligentAnalysisPrompt = `
You are an expert career analyst. Analyze this resume content and make intelligent deductions about the person's interests, accomplishments, and industries. Return a JSON object with these exact fields:

{
  "interests": ["array of professional/personal interests deduced from projects, activities, volunteer work, hobbies mentioned"],
  "accomplishments_most_proud": ["array of 3-5 most significant accomplishments that show impact and results"],
  "industries": ["array of industries the person has worked in or has experience with, inferred from company types, role contexts, and projects"]
}

Guidelines:
- For interests: Look for patterns in projects, volunteer work, side activities, certifications that indicate genuine interests
- For accomplishments: Focus on quantifiable results, leadership roles, innovations, or significant contributions that demonstrate impact
- For industries: Go beyond just job titles - consider company types, project contexts, clients worked with, domain knowledge demonstrated

Only return the JSON object, no additional text.

Resume content:
${fileContent}
`;

    const intelligentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert career analyst who makes intelligent deductions from professional documents.' 
          },
          { role: 'user', content: intelligentAnalysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!intelligentResponse.ok) {
      throw new Error(`OpenAI intelligent analysis error: ${intelligentResponse.statusText}`);
    }

    const intelligentData = await intelligentResponse.json();
    const intelligentExtractedText = intelligentData.choices[0].message.content;
    
    let intelligentExtractedData;
    try {
      intelligentExtractedData = JSON.parse(intelligentExtractedText);
    } catch (parseError) {
      console.error('Failed to parse intelligent analysis response as JSON:', parseError);
      // If intelligent analysis fails, continue with basic data only
      intelligentExtractedData = {
        interests: [],
        accomplishments_most_proud: [],
        industries: []
      };
    }

    // Combine both extractions
    const combinedExtractedData = {
      ...basicExtractedData,
      ...intelligentExtractedData
    };

    console.log('Combined extracted data:', combinedExtractedData);

    return new Response(JSON.stringify({ 
      success: true,
      extractedData: combinedExtractedData,
      message: 'Resume processed successfully with intelligent analysis'
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
