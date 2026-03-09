
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mapExtractedDataToSurvey } from '../utils/resumeDataMapper';

const N8N_RESUME_WEBHOOK_URL = import.meta.env.VITE_N8N_RESUME_WEBHOOK_URL;

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

    if (!N8N_RESUME_WEBHOOK_URL) {
      console.error('[ResumeUpload] VITE_N8N_RESUME_WEBHOOK_URL not configured');
      onError?.('Resume processing is not configured. Please contact support.');
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);

    try {
      // Step 1: Upload file to Supabase Storage
      console.log('[ResumeUpload] Uploading file to Supabase Storage...');
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[ResumeUpload] Storage upload failed:', uploadError);
        throw new Error('Failed to upload file. Please try again.');
      }

      console.log('[ResumeUpload] File uploaded:', uploadData.path);

      // Step 2: Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;
      console.log('[ResumeUpload] File URL:', fileUrl);

      setIsUploading(false);
      // Still processing (AI extraction happening in n8n)

      // Step 3: Call n8n webhook with file URL and user ID
      console.log('[ResumeUpload] Calling n8n webhook for AI extraction...');
      const webhookResponse = await fetch(N8N_RESUME_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: fileUrl,
          user_id: user.id
        })
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('[ResumeUpload] n8n webhook error:', webhookResponse.status, errorText);
        throw new Error('Resume processing failed. Please try again.');
      }

      const n8nResult = await webhookResponse.json();
      console.log('[ResumeUpload] n8n response:', n8nResult);

      // Step 4: Unwrap the n8n response — it may come as nested arrays [[{...}]]
      let resultData = n8nResult;
      while (Array.isArray(resultData)) {
        resultData = resultData[0];
      }
      console.log('[ResumeUpload] Unwrapped result:', resultData);

      // Map the raw AI output to survey question IDs
      // The n8n response contains parsed_raw (raw AI JSON with field names)
      const rawAiData = resultData?.parsed_raw;
      if (!rawAiData) {
        console.error('[ResumeUpload] No parsed_raw in n8n response:', n8nResult);
        throw new Error('Resume processing returned unexpected data format.');
      }

      // Use the frontend mapping function for proper survey formatting
      const surveyPreFillData = mapExtractedDataToSurvey(rawAiData);

      const result = {
        success: true,
        aiParsedData: surveyPreFillData,
        surveyPreFillData: surveyPreFillData,
        fieldsExtracted: Object.keys(surveyPreFillData).length,
        rawData: rawAiData
      };

      setProcessingResult(result);
      setHasProcessed(true);
      onSuccess?.(result);

    } catch (error: any) {
      console.error('[ResumeUpload] Error processing resume:', error);
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
