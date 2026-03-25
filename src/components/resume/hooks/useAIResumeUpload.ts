
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
