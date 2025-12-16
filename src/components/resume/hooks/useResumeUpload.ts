
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseResumeUploadProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useResumeUpload = ({ onSuccess, onError }: UseResumeUploadProps) => {
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

      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: formData
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      setProcessingResult(data);

      if (data?.success && data?.extractedText) {
        const wordCount = data.wordCount || 0;
        const charCount = data.contentLength || 0;

        if (wordCount > 20 && charCount > 100) {
          // Store the extracted data in the profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              resume_data: data.extractedText,
              resume_uploaded_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            console.warn('Failed to save resume data to profile:', updateError);
          }

          setHasProcessed(true);
          onSuccess?.(data);
        } else {
          throw new Error(`Document processed but contains very little text (${wordCount} words). Please ensure your resume has readable content.`);
        }
      } else {
        throw new Error(data?.error || 'Failed to extract text from document');
      }

    } catch (error) {
      console.error('Error processing resume:', error);
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
