
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mapExtractedDataToSurvey } from '../utils/resumeDataMapper';

// Resume extraction is proxied through a Supabase Edge Function
// (eliminates CORS issues and hides the n8n webhook URL from the client)

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

      // Step 2: Get a signed URL (expires in 5 minutes — enough for n8n to download)
      const { data: urlData, error: signError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 300);

      if (signError || !urlData?.signedUrl) {
        console.error('[ResumeUpload] Failed to create signed URL:', signError);
        throw new Error('Failed to prepare file for processing. Please try again.');
      }

      const fileUrl = urlData.signedUrl;
      console.log('[ResumeUpload] Signed URL created (expires in 5 min)');

      setIsUploading(false);
      // Still processing (AI extraction happening in n8n)

      // Step 3: Call edge function proxy (which forwards to n8n server-side — no CORS issues)
      console.log('[ResumeUpload] Calling edge function for AI extraction...');
      const { data: n8nResult, error: fnError } = await supabase.functions.invoke('forward-resume-to-n8n', {
        body: { file_url: fileUrl, user_id: user.id }
      });

      if (fnError) {
        console.error('[ResumeUpload] Edge function error:', fnError);
        throw new Error('Resume processing failed. Please try again.');
      }

      console.log('[ResumeUpload] Edge function response:', n8nResult);

      // Step 4: Extract survey data from n8n response
      // The webhook returns: {success, message, data: {resume_parsed_data: {uuid: {value: ...}}}}
      // Or sometimes arrays/direct formats — handle all cases
      let payload = n8nResult;

      // Unwrap arrays if present
      while (Array.isArray(payload)) {
        payload = payload[0];
      }

      // Unwrap {data: ...} wrapper from Respond to Webhook node
      if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        payload = payload.data;
      }

      // Unwrap arrays inside data too
      while (Array.isArray(payload)) {
        payload = payload[0];
      }

      console.log('[ResumeUpload] Final payload keys:', Object.keys(payload || {}));

      let surveyPreFillData: Record<string, any>;

      if (payload?.parsed_raw) {
        // Option A: parsed_raw exists — use frontend mapper
        console.log('[ResumeUpload] Using parsed_raw with frontend mapper');
        surveyPreFillData = mapExtractedDataToSurvey(payload.parsed_raw);
      } else if (payload?.resume_parsed_data) {
        // Option B: n8n already mapped to UUIDs — unwrap {value: ...} wrappers
        console.log('[ResumeUpload] Using pre-mapped resume_parsed_data from n8n');
        surveyPreFillData = {};
        for (const [questionId, wrapper] of Object.entries(payload.resume_parsed_data)) {
          surveyPreFillData[questionId] = (wrapper as any)?.value ?? wrapper;
        }
      } else {
        console.error('[ResumeUpload] No parsed_raw or resume_parsed_data found. Keys:', Object.keys(payload || {}));
        throw new Error('Resume processing returned unexpected data format.');
      }

      const result = {
        success: true,
        aiParsedData: surveyPreFillData,
        surveyPreFillData: surveyPreFillData,
        fieldsExtracted: Object.keys(surveyPreFillData).length,
        rawData: payload?.parsed_raw || payload
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
