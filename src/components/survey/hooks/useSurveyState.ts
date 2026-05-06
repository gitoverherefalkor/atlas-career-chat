
import { useState, useEffect, useCallback } from 'react';
import { useSurvey } from '@/hooks/useSurvey';
import { useSurveySession } from '@/hooks/useSurveySession';
import { supabase } from '@/integrations/supabase/client';

export const useSurveyState = (surveyId: string, accessCodeId?: string) => {
  const { data: survey, isLoading, error } = useSurvey(surveyId);
  const { getStoredSession, saveSession, clearSession } = useSurveySession(surveyId);
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'submitted' | 'failed'>('idle');
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Helper function to check if a question should be skipped
  const shouldSkipQuestion = useCallback((question: any) => {
    const licenseKeyIndicators = ['license', 'access code', 'verification code', 'license key'];
    const questionText = question.label?.toLowerCase() || '';
    return licenseKeyIndicators.some(indicator => questionText.includes(indicator));
  }, []);

  // Get filtered questions for current section (excluding license key questions)
  const getFilteredQuestions = useCallback((section: any) => {
    return section.questions.filter((q: any) => !shouldSkipQuestion(q));
  }, [shouldSkipQuestion]);

  // Load session on mount - ONLY ONCE
  // Priority: localStorage (fast, same device) → Supabase answers table (cross-device fallback)
  useEffect(() => {
    if (!survey || isSessionLoaded) return;

    const storedSession = getStoredSession();
    if (storedSession) {
      setResponses(storedSession.responses);
      setCurrentSectionIndex(storedSession.currentSectionIndex);
      setCurrentQuestionIndex(storedSession.currentQuestionIndex);
      setShowSectionIntro(storedSession.showSectionIntro);
      setCompletedSections(storedSession.completedSections);
      const submissionData = storedSession as any;
      if (submissionData.submissionStatus) {
        setSubmissionStatus(submissionData.submissionStatus);
      }
      setIsSessionLoaded(true);
      return;
    }

    // No localStorage session — try to restore from Supabase answers table
    if (!accessCodeId) {
      setIsSessionLoaded(true);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from('answers')
          .select('payload')
          .eq('access_code_id', accessCodeId)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.payload && typeof data.payload === 'object') {
          const savedResponses = data.payload as Record<string, any>;
          setResponses(savedResponses);

          // Find the first unanswered question to resume from
          let resumeSectionIdx = 0;
          let resumeQIdx = 0;
          let found = false;
          const completed: number[] = [];

          for (let sIdx = 0; sIdx < survey.sections.length; sIdx++) {
            const section = survey.sections[sIdx];
            const questions = getFilteredQuestions(section);
            const allAnswered = questions.every(
              (q: any) => savedResponses[q.id] !== undefined && savedResponses[q.id] !== null && savedResponses[q.id] !== ''
            );

            if (allAnswered) {
              completed.push(sIdx);
            }

            if (!found) {
              for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                const q = questions[qIdx];
                const ans = savedResponses[q.id];
                if (ans === undefined || ans === null || ans === '') {
                  resumeSectionIdx = sIdx;
                  resumeQIdx = qIdx;
                  found = true;
                  break;
                }
              }
            }
          }

          // If all questions answered, land on the last question of the last section
          if (!found && survey.sections.length > 0) {
            resumeSectionIdx = survey.sections.length - 1;
            const lastSection = survey.sections[resumeSectionIdx];
            const lastQuestions = getFilteredQuestions(lastSection);
            resumeQIdx = Math.max(0, lastQuestions.length - 1);
          }

          setCurrentSectionIndex(resumeSectionIdx);
          setCurrentQuestionIndex(resumeQIdx);
          setShowSectionIntro(resumeQIdx === 0);
          setCompletedSections(completed);
        }
      } catch (err) {
        console.error('Failed to restore survey session from database:', err);
      } finally {
        setIsSessionLoaded(true);
      }
    })();
  }, [survey, isSessionLoaded, getStoredSession, accessCodeId, getFilteredQuestions]);

  // Save session whenever state changes - but only after session is loaded
  useEffect(() => {
    if (survey && isSessionLoaded) {
      const session = {
        responses,
        currentSectionIndex,
        currentQuestionIndex,
        showSectionIntro,
        completedSections,
        submissionStatus
      };
      saveSession(session);
    }
  }, [responses, currentSectionIndex, currentQuestionIndex, showSectionIntro, completedSections, submissionStatus, survey, saveSession, isSessionLoaded]);

  return {
    // Data
    survey,
    isLoading,
    error,
    // State
    currentSectionIndex,
    currentQuestionIndex,
    responses,
    isSubmitting,
    submissionStatus,
    showSectionIntro,
    completedSections,
    isSessionLoaded,
    // Setters
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
    setResponses,
    setIsSubmitting,
    setSubmissionStatus,
    setShowSectionIntro,
    setCompletedSections,
    // Helpers
    shouldSkipQuestion,
    getFilteredQuestions,
    // Session management
    clearSession
  };
};
