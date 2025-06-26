
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple PDF text extraction function
async function extractPDFText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import pdf-parse which is the most reliable for Deno
    const pdfParse = (await import('https://esm.sh/pdf-parse@1.1.1')).default;
    
    // Parse the PDF
    const data = await pdfParse(arrayBuffer);
    
    console.log(`PDF parsed successfully. Pages: ${data.numpages}, Text length: ${data.text.length}`);
    
    return data.text || '';
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file uploaded',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    let fileContent = '';
    
    // Handle PDF files
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        fileContent = await extractPDFText(arrayBuffer);
        
        // Clean up the extracted text
        fileContent = fileContent
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
          .trim();
        
        console.log(`Successfully extracted ${fileContent.length} characters from PDF`);
        
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError);
        
        // Provide helpful error message
        const errorMessage = pdfError.message.toLowerCase();
        if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
          return new Response(JSON.stringify({ 
            error: 'This PDF is password protected. Please provide an unprotected version of your resume.',
            success: false 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
          return new Response(JSON.stringify({ 
            error: 'The PDF file appears to be corrupted. Please try uploading a different version.',
            success: false 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ 
            error: 'Unable to extract text from this PDF. This might be a scanned image rather than a text-based PDF. Please try converting it to a Word document or ensure it contains selectable text.',
            success: false 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    
    // Handle Word documents (.docx, .doc)
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             file.type === 'application/msword') {
      try {
        const mammoth = await import('https://esm.sh/mammoth@1.6.0');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value.trim();
        
        console.log(`Successfully extracted ${fileContent.length} characters from Word document`);
        
      } catch (wordError) {
        console.error('Word document extraction failed:', wordError);
        return new Response(JSON.stringify({ 
          error: 'Unable to extract text from this Word document. Please ensure the file is not corrupted.',
          success: false 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Handle plain text files
    else if (file.type === 'text/plain') {
      fileContent = (await file.text()).trim();
      console.log(`Successfully read ${fileContent.length} characters from text file`);
    }
    
    // Unsupported file type
    else {
      const supportedTypes = [
        'PDF files (.pdf)',
        'Word documents (.docx, .doc)', 
        'Text files (.txt)'
      ];
      return new Response(JSON.stringify({ 
        error: `Unsupported file type: ${file.type}. Please upload one of: ${supportedTypes.join(', ')}`,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate that we extracted meaningful content
    if (!fileContent || fileContent.length < 20) {
      return new Response(JSON.stringify({ 
        error: 'The file appears to be empty or contains very little text. Please ensure your resume has readable content.',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Continue with existing OpenAI processing for all file types
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
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${basicResponse.statusText}`,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const basicData = await basicResponse.json();
    const basicExtractedText = basicData.choices[0].message.content;
    
    let basicExtractedData;
    try {
      basicExtractedData = JSON.parse(basicExtractedText);
    } catch (parseError) {
      console.error('Failed to parse basic extraction response as JSON:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse basic resume data',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      console.error('OpenAI intelligent analysis error:', intelligentResponse.statusText);
      // If intelligent analysis fails, continue with basic data only
    }

    let intelligentExtractedData = {
      interests: [],
      accomplishments_most_proud: [],
      industries: []
    };

    if (intelligentResponse.ok) {
      const intelligentData = await intelligentResponse.json();
      const intelligentExtractedText = intelligentData.choices[0].message.content;
      
      try {
        intelligentExtractedData = JSON.parse(intelligentExtractedText);
      } catch (parseError) {
        console.error('Failed to parse intelligent analysis response as JSON:', parseError);
        // Continue with empty intelligent data if parsing fails
      }
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
