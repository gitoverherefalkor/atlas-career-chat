
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Function to safely extract PDF text with fallback methods
async function extractPDFText(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log('Starting PDF text extraction...');
  console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
  
  // Method 1: Try pdf-parse from esm.sh
  try {
    console.log('Attempting Method 1: pdf-parse from esm.sh');
    const pdfParse = (await import('https://esm.sh/pdf-parse@1.1.1')).default;
    const data = await pdfParse(arrayBuffer);
    console.log('Method 1 SUCCESS - Pages:', data.numpages, 'Text length:', data.text?.length || 0);
    return data.text || '';
  } catch (error1) {
    console.log('Method 1 FAILED:', error1.message);
  }

  // Method 2: Try different CDN
  try {
    console.log('Attempting Method 2: pdf-parse from cdn.skypack.dev');
    const pdfParse = (await import('https://cdn.skypack.dev/pdf-parse@1.1.1')).default;
    const data = await pdfParse(arrayBuffer);
    console.log('Method 2 SUCCESS - Pages:', data.numpages, 'Text length:', data.text?.length || 0);
    return data.text || '';
  } catch (error2) {
    console.log('Method 2 FAILED:', error2.message);
  }

  // Method 3: Basic text extraction fallback
  try {
    console.log('Attempting Method 3: Basic text extraction');
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfString = decoder.decode(uint8Array);
    
    // Look for text patterns in PDF
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const textRegex = /\((.*?)\)/g;
    
    let extractedText = '';
    let match;
    
    // Extract from streams
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      let textMatch;
      while ((textMatch = textRegex.exec(streamContent)) !== null) {
        extractedText += textMatch[1] + ' ';
      }
    }
    
    // Also try direct text extraction
    let directMatch;
    while ((directMatch = textRegex.exec(pdfString)) !== null) {
      extractedText += directMatch[1] + ' ';
    }
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\\[rn]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Method 3 result - Text length:', extractedText.length);
    
    if (extractedText.length > 10) {
      console.log('Method 3 SUCCESS');
      return extractedText;
    } else {
      throw new Error('Insufficient text extracted');
    }
    
  } catch (error3) {
    console.log('Method 3 FAILED:', error3.message);
  }

  throw new Error('All PDF extraction methods failed');
}

// Function to clean text for database storage
function cleanTextForDatabase(text: string): string {
  return text
    // Remove null bytes and other problematic Unicode characters
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\uFEFF/g, '') // Remove BOM
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  console.log('=== EDGE FUNCTION STARTED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Check if this is a basic test
    if (req.url.includes('test-basic')) {
      console.log('Basic test endpoint');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Edge function is working',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check content type
    const contentType = req.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      throw new Error(`Expected multipart/form-data, got: ${contentType}`);
    }

    // Parse form data
    console.log('Parsing form data...');
    const formData = await req.formData();
    console.log('Form data keys:', Array.from(formData.keys()));

    const file = formData.get('file') as File;
    console.log('File object:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      exists: !!file
    });

    if (!file) {
      throw new Error('No file found in form data');
    }

    let fileContent = '';
    let processingMethod = 'unknown';

    // Handle different file types
    if (file.type === 'application/pdf') {
      console.log('Processing PDF file...');
      processingMethod = 'PDF';
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('PDF ArrayBuffer created, size:', arrayBuffer.byteLength);
        
        fileContent = await extractPDFText(arrayBuffer);
        console.log('PDF text extracted successfully, length:', fileContent.length);
        
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError.message);
        console.error('PDF error stack:', pdfError.stack);
        throw new Error(`PDF processing failed: ${pdfError.message}`);
      }
      
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               file.type === 'application/msword') {
      console.log('Processing Word document...');
      processingMethod = 'Word';
      
      try {
        const mammoth = await import('https://esm.sh/mammoth@1.6.0');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value;
        console.log('Word text extracted successfully, length:', fileContent.length);
        
      } catch (wordError) {
        console.error('Word processing error:', wordError.message);
        throw new Error(`Word processing failed: ${wordError.message}`);
      }
      
    } else if (file.type === 'text/plain') {
      console.log('Processing text file...');
      processingMethod = 'Text';
      fileContent = await file.text();
      console.log('Text file read successfully, length:', fileContent.length);
      
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Validate extracted content
    console.log('Validating extracted content...');
    if (!fileContent || fileContent.trim().length < 10) {
      throw new Error(`Insufficient content extracted. Got ${fileContent?.length || 0} characters`);
    }

    // Clean the content for database storage
    fileContent = cleanTextForDatabase(fileContent);
    console.log('Text cleaned for database, final length:', fileContent.length);

    const wordCount = fileContent.split(/\s+/).length;
    console.log('Content validation passed:', {
      charCount: fileContent.length,
      wordCount: wordCount,
      method: processingMethod
    });

    // For now, just return the extracted text without OpenAI processing
    // This will help us confirm the PDF extraction is working
    const result = {
      success: true,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      processingMethod: processingMethod,
      contentLength: fileContent.length,
      wordCount: wordCount,
      extractedText: fileContent,
      preview: fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : ''),
      timestamp: new Date().toISOString(),
      message: 'File processed successfully - OpenAI integration temporarily disabled for debugging'
    };

    console.log('=== SUCCESS ===');
    console.log('Response summary:', {
      success: result.success,
      filename: result.filename,
      contentLength: result.contentLength,
      wordCount: result.wordCount
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', error.constructor.name);

    const errorResponse = {
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      debug: {
        method: req.method,
        url: req.url,
        contentType: req.headers.get('content-type'),
        userAgent: req.headers.get('user-agent')
      }
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
