
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEngagementTracking } from '@/hooks/useEngagementTracking';

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
  const navigate = useNavigate();
  const { trackSurveyComplete } = useEngagementTracking();
  const isSubmittingRef = useRef(false);

  const markAccessCodeAsUsed = useCallback(async () => {
    if (!accessCodeData?.id) return;

    try {
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
      }
    } catch (error) {
      console.error('Error marking access code as used:', error);
    }
  }, [accessCodeData]);

  const handleSubmit = useCallback(async () => {
    if (!accessCodeData || !user) return;
    // Prevent double-submission (ref check is synchronous, unlike state)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsSubmitting(true);
    setSubmissionStatus('submitting');

    try {
      // Sanitize payload before submission: the skills UI stores up to 9 CV-order skills
      // plus a parallel topSkillRanks array marking which three the user tagged as 1/2/3.
      // n8n's scoring workflow expects a 3-item top_skills list, so we reorder here.
      // Fallback (no ranks present, legacy data): take first 3 non-empty in array order.
      const SKILLS_ACHIEVEMENTS_ID = '11111111-1111-1111-1111-11111111111f';
      const sanitizedResponses = { ...responses };
      const skillsAnswer = sanitizedResponses[SKILLS_ACHIEVEMENTS_ID];
      if (skillsAnswer && typeof skillsAnswer === 'object' && Array.isArray(skillsAnswer.topSkills)) {
        const ranks: number[] = Array.isArray(skillsAnswer.topSkillRanks)
          ? skillsAnswer.topSkillRanks
          : [];

        let topThree: string[];
        if (ranks.some(r => r === 1 || r === 2 || r === 3)) {
          topThree = [1, 2, 3]
            .map(rank => {
              const idx = ranks.findIndex(r => r === rank);
              return idx >= 0 ? skillsAnswer.topSkills[idx] : '';
            })
            .filter((s: string) => s && s.trim() !== '');
        } else {
          topThree = skillsAnswer.topSkills.slice(0, 3).filter((s: string) => s && s.trim() !== '');
        }

        sanitizedResponses[SKILLS_ACHIEVEMENTS_ID] = {
          ...skillsAnswer,
          topSkills: topThree
        };
      }

      // Upsert final submission. The autosave path keeps a 'draft' row in sync
      // throughout the survey; on submit we flip status to 'submitted' on the same row.
      const answerData: any = {
        survey_id: surveyId,
        payload: sanitizedResponses,
        access_code_id: accessCodeData?.id,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      const { data: submissionData, error: submissionError } = await supabase
        .from('answers')
        .upsert(answerData, { onConflict: 'access_code_id' })
        .select();

      if (submissionError) {
        console.error('Error submitting survey:', submissionError);
        setSubmissionStatus('failed');
        isSubmittingRef.current = false; // Allow retry on failure
        toast({
          title: "Submission Failed",
          description: "Failed to submit your responses. Please try again - your answers are saved.",
          variant: "destructive",
        });
        return;
      }

      // Mark access code as used after successful submission
      await markAccessCodeAsUsed();

      // Update profile with region from survey (question ID: 11111111-1111-1111-1111-111111111114)
      const regionAnswer = responses['11111111-1111-1111-1111-111111111114'];
      if (regionAnswer && user) {
        try {
          await supabase
            .from('profiles')
            .update({ region: regionAnswer })
            .eq('id', user.id);
          console.log('Profile updated with region:', regionAnswer);
        } catch (error) {
          console.error('Error updating profile with region:', error);
          // Don't fail submission if profile update fails
        }
      }

      setSubmissionStatus('submitted');

      // Track survey completion for reminder system
      trackSurveyComplete();

      toast({
        title: "Survey Submitted Successfully",
        description: "Redirecting to processing page...",
      });

      // Call completion handler (but don't clear session yet)
      onComplete(responses);

      // Redirect to processing page
      setTimeout(() => {
        navigate('/report-processing');
      }, 1500);
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSubmissionStatus('failed');
      isSubmittingRef.current = false; // Allow retry on failure
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
    isSubmittingRef.current = false;
    setSubmissionStatus('idle');
    handleSubmit();
  };

  return {
    handleSubmit,
    handleRetrySubmission
  };
};
