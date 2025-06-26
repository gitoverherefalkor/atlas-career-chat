
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseSurveySubmissionProps {
  surveyId: string;
  responses: Record<string, any>;
  accessCodeData: any;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmissionStatus: (status: 'idle' | 'submitting' | 'submitted' | 'failed') => void;
  onComplete: (responses: Record<string, any>) => void;
}

export const useSurveySubmission = ({
  surveyId,
  responses,
  accessCodeData,
  setIsSubmitting,
  setSubmissionStatus,
  onComplete
}: UseSurveySubmissionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const markAccessCodeAsUsed = useCallback(async () => {
    if (!accessCodeData?.id) return;

    try {
      console.log('Marking access code as used:', accessCodeData.id);
      
      // First get the current usage count
      const { data: currentCode, error: fetchError } = await supabase
        .from('access_codes')
        .select('usage_count')
        .eq('id', accessCodeData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current usage count:', fetchError);
        return;
      }

      // Increment the usage count
      const newUsageCount = (currentCode.usage_count || 0) + 1;
      
      const { error } = await supabase
        .from('access_codes')
        .update({ 
          usage_count: newUsageCount,
          used_at: new Date().toISOString()
        })
        .eq('id', accessCodeData.id);

      if (error) {
        console.error('Error marking access code as used:', error);
      } else {
        console.log('Access code marked as used successfully');
      }
    } catch (error) {
      console.error('Error marking access code as used:', error);
    }
  }, [accessCodeData]);

  const handleSubmit = useCallback(async () => {
    if (!accessCodeData || !user) return;
    
    setIsSubmitting(true);
    setSubmissionStatus('submitting');

    try {
      console.log('Submitting survey responses:', responses);
      console.log('Access code data:', accessCodeData);
      console.log('User:', user);

      // Submit to database with access code reference
      const answerData: any = {
        survey_id: surveyId,
        payload: responses,
        access_code_id: accessCodeData?.id
      };

      const { data: submissionData, error: submissionError } = await supabase
        .from('answers')
        .insert(answerData)
        .select();

      if (submissionError) {
        console.error('Error submitting survey:', submissionError);
        setSubmissionStatus('failed');
        toast({
          title: "Submission Failed",
          description: "Failed to submit your responses. Please try again - your answers are saved.",
          variant: "destructive",
        });
        return;
      }

      console.log('Survey submitted successfully:', submissionData);

      // Mark access code as used after successful submission
      await markAccessCodeAsUsed();

      setSubmissionStatus('submitted');

      toast({
        title: "Survey Submitted Successfully",
        description: "Your responses are saved. Your report is being generated and you'll receive an email when ready.",
      });

      // Call completion handler (but don't clear session yet)
      onComplete(responses);
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSubmissionStatus('failed');
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again - your answers are saved.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [surveyId, responses, accessCodeData, user, setIsSubmitting, setSubmissionStatus, onComplete, toast, markAccessCodeAsUsed]);

  const handleRetrySubmission = () => {
    setSubmissionStatus('idle');
    handleSubmit();
  };

  return {
    handleSubmit,
    handleRetrySubmission
  };
};
