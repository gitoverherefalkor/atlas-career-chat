
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

  // Load session on mount - ONLY ONCE.
  // Source of truth is the Supabase answers row (because autosave keeps it ahead).
  // localStorage is only used when DB has fewer responses (or DB is unreachable).
  useEffect(() => {
    if (!survey || isSessionLoaded) return;

    const storedSession = getStoredSession();
    const localResponses: Record<string, any> = storedSession?.responses || {};
    const localKeyCount = Object.keys(localResponses).length;

    const applyFromLocal = () => {
      if (!storedSession) return;
      setResponses(localResponses);
      setCurrentSectionIndex(storedSession.currentSectionIndex || 0);
      setCurrentQuestionIndex(storedSession.currentQuestionIndex || 0);
      setShowSectionIntro(storedSession.showSectionIntro ?? true);
      setCompletedSections(storedSession.completedSections || []);
      const submissionData = storedSession as any;
      if (submissionData.submissionStatus) {
        setSubmissionStatus(submissionData.submissionStatus);
      }
    };

    const applyFromDb = (savedResponses: Record<string, any>, status?: string) => {
      setResponses(savedResponses);
      if (status === 'submitted') {
        setSubmissionStatus('submitted');
      }

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
        if (allAnswered) completed.push(sIdx);

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
    };

    // No access code → can only use localStorage
    if (!accessCodeId) {
      if (localKeyCount > 0) applyFromLocal();
      setIsSessionLoaded(true);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from('answers')
          .select('payload, status')
          .eq('access_code_id', accessCodeId)
          .maybeSingle();

        const dbResponses =
          data?.payload && typeof data.payload === 'object'
            ? (data.payload as Record<string, any>)
            : null;
        const dbKeyCount = dbResponses ? Object.keys(dbResponses).length : 0;

        if (dbResponses && dbKeyCount >= localKeyCount) {
          applyFromDb(dbResponses, data?.status);
        } else if (localKeyCount > 0) {
          applyFromLocal();
        }
      } catch (err) {
        console.error('Failed to restore survey session from database:', err);
        if (localKeyCount > 0) applyFromLocal();
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

  // Debounced autosave to Supabase answers table (status='draft').
  // Skipped when status is already 'submitted' so we don't downgrade a finalized row.
  useEffect(() => {
    if (!isSessionLoaded || !accessCodeId || !survey) return;
    if (submissionStatus === 'submitted' || submissionStatus === 'submitting') return;
    if (Object.keys(responses).length === 0) return;

    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('answers')
          .upsert(
            {
              access_code_id: accessCodeId,
              survey_id: surveyId,
              payload: responses,
              status: 'draft',
              submitted_at: null,
            },
            { onConflict: 'access_code_id' }
          );
        if (error) console.error('Autosave to Supabase failed:', error);
      } catch (err) {
        console.error('Autosave to Supabase error:', err);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [responses, isSessionLoaded, accessCodeId, surveyId, survey, submissionStatus]);

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
