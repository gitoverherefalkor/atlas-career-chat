
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSurvey } from '@/hooks/useSurvey';

interface UseAIResumePreFillProps {
  isSessionLoaded: boolean;
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any>) => void;
  surveyId: string;
}

export const useAIResumePreFill = ({ isSessionLoaded, responses, setResponses, surveyId }: UseAIResumePreFillProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: survey } = useSurvey(surveyId);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!user || !survey) return;
    const prefillFlagKey = `prefill_done_${user.id}_${survey.id}`;
    const hasPrefilled = localStorage.getItem(prefillFlagKey) === 'true';
    const preSurveyUploadComplete = localStorage.getItem('pre_survey_upload_complete') === 'true';
    // Prevent effect from running more than once per session or after pre-survey upload is complete
    if (hasRunRef.current || hasPrefilled || preSurveyUploadComplete) {
      console.log('[Pre-fill] Skipping: already pre-filled or pre-survey upload complete for this user/session.');
      return;
    }
    if (isSessionLoaded && Object.keys(responses).length === 0 && !hasPrefilled && !preSurveyUploadComplete) {
      hasRunRef.current = true;
      supabase
        .from('profiles')
        .select('resume_data, resume_parsed_data')
        .eq('id', user.id)
        .maybeSingle()
        .then(async ({ data: profile, error }) => {
          try {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }
          if (profile?.resume_parsed_data && typeof profile.resume_parsed_data === 'object') {
            const parsedData = profile.resume_parsed_data as Record<string, any>;
              const section1 = survey.sections[0];
              const validResponses: Record<string, any> = {};
              if (section1) {
                section1.questions.forEach((q) => {
                  const value = parsedData[q.id];
                  if (value === undefined || value === null || value === '') return;
                  if (q.type === 'multiple_choice' && q.allow_multiple) {
                    if (Array.isArray(value)) {
                      validResponses[q.id] = value.filter((v) => q.config.choices?.includes(v));
                    } else if (typeof value === 'string' && q.config.choices?.includes(value)) {
                      validResponses[q.id] = [value];
                    }
                  } else if (q.type === 'multiple_choice') {
                    if (typeof value === 'string' && q.config.choices?.includes(value)) {
                      validResponses[q.id] = value;
                    }
                  } else if (q.type === 'dropdown') {
                    if (typeof value === 'string' && q.config.choices?.includes(value)) {
                      validResponses[q.id] = value;
                    }
                  } else if (q.type === 'number') {
                    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
                      validResponses[q.id] = Number(value);
                    }
                  } else if (q.type === 'short_text' || q.type === 'long_text') {
                    if (typeof value === 'string') {
                      validResponses[q.id] = value;
                    }
                  }
                });
              }
              if (Object.keys(validResponses).length > 0) {
                setResponses(validResponses);
                localStorage.setItem(prefillFlagKey, 'true');
              toast({
                  title: 'AI Pre-fill Complete! 🎉',
                  description: `${Object.keys(validResponses).length} fields have been intelligently pre-filled from your resume using AI.`,
              });
                console.log('[Pre-fill] Successfully pre-filled and set flag:', prefillFlagKey);
              } else {
                console.log('[Pre-fill] No valid responses to pre-fill.');
              }
            } else {
              console.log('[Pre-fill] No resume_parsed_data found.');
            }
          } catch (err) {
            console.error('Error in pre-fill effect:', err);
          }
        });
    } else {
      if (Object.keys(responses).length > 0) {
        console.log('[Pre-fill] Skipping: responses already present.');
      } else {
        console.log('[Pre-fill] Skipping: session not loaded or missing user/survey.');
      }
    }
  }, [isSessionLoaded, user?.id, survey, responses, setResponses, toast]);
};
