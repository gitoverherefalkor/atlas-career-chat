
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { extractTextFromFile } from '../utils/clientSidePdfParser';
import { parseResumeWithAI } from '../utils/aiResumeParser';

interface UseAIResumeUploadProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useAIResumeUpload = ({ onSuccess, onError }: UseAIResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const { user } = useAuth();

  const uploadAndProcess = async (file: File) => {
    if (!user) {
      onError?.('User not authenticated');
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);

    try {
      console.log('Step 1: Processing file client-side:', file.name, file.type);
      
      // Extract text client-side
      const extractedText = await extractTextFromFile(file);
      
      console.log('Step 2: Extracted text length:', extractedText.length);
      console.log('First 200 characters:', extractedText.substring(0, 200));
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Document appears to be empty or text could not be extracted');
      }
      
      // Parse with AI
      console.log('Step 3: Parsing with AI...');
      const aiParsedData = await parseResumeWithAI(extractedText);
      
      console.log('Step 4: AI parsing complete, fields extracted:', Object.keys(aiParsedData).length);

      // Save both raw text and AI-parsed data to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_data: extractedText,
          resume_parsed_data: aiParsedData,
          resume_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to save resume data to profile:', updateError);
        throw new Error('Failed to save resume data');
      }

      console.log('Step 5: Successfully saved to database');

      const result = {
        success: true,
        extractedText,
        aiParsedData,
        surveyPreFillData: aiParsedData,
        wordCount: extractedText.split(/\s+/).length,
        fieldsExtracted: Object.keys(aiParsedData).length
      };

      setProcessingResult(result);
      setHasProcessed(true);
      onSuccess?.(result);

    } catch (error) {
      console.error('Error processing resume with AI:', error);
      onError?.(error.message || 'Failed to process resume');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setHasProcessed(false);
    setProcessingResult(null);
  };

  return {
    isUploading,
    isProcessing,
    hasProcessed,
    setHasProcessed,
    processingResult,
    uploadAndProcess,
    resetState
  };
};
