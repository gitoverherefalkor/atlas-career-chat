
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
      const formData = new FormData();
      formData.append('file', file);

      console.log('Step 1: Extracting text from file:', file.name);

      // First, extract text from the document using existing function
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke('parse-resume', {
        body: formData
      });

      if (extractionError || !extractionData?.extractedText) {
        throw new Error('Failed to extract text from document');
      }

      console.log('Step 2: Text extracted, length:', extractionData.extractedText.length);

      // Then, use AI to parse the extracted text
      console.log('Step 3: Parsing with AI...');
      const aiParsedData = await parseResumeWithAI(extractionData.extractedText);
      
      console.log('Step 4: AI parsing complete, fields extracted:', Object.keys(aiParsedData).length);

      // Save both raw text and AI-parsed data to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_data: extractionData.extractedText,
          resume_parsed_data: aiParsedData,
          resume_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.warn('Failed to save resume data to profile:', updateError);
      } else {
        console.log('Step 5: Resume data saved to profile successfully');
      }

      const result = {
        ...extractionData,
        aiParsedData,
        surveyPreFillData: aiParsedData,
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
