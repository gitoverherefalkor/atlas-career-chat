
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSurveyIdFromAccessCode } from './constants';
import { useAssessmentSession } from './AssessmentSessionContext';
import { useSurveyCompletion } from './hooks/useSurveyCompletion';
import { useAssessmentNavigation } from './hooks/useAssessmentNavigation';

export const useAssessmentLogic = () => {
  console.log('useAssessmentLogic hook initialized');
  
  const { user, isLoading: authLoading } = useAuth();
  const { redirectToAuth } = useAssessmentNavigation();
  const { session, updateSession, clearSession } = useAssessmentSession();
  const {
    isCompleted,
    handleSurveyComplete: baseSurveyComplete
  } = useSurveyCompletion();
  const { handleExitAssessment } = useAssessmentNavigation();

  console.log('useAssessmentLogic state:', {
    isCompleted,
    isVerified: session.isVerified,
    showPreSurveyUpload: session.showPreSurveyUpload,
    accessCodeData: session.accessCodeData,
    sessionToken: session.sessionToken,
    authLoading,
    user: user ? { id: user.id, email: user.email } : null
  });

  useEffect(() => {
    console.log('useAssessmentLogic useEffect triggered', { authLoading, user });
    // Don't redirect if still loading
    if (authLoading) {
      console.log('Still loading auth, waiting...');
      return;
    }
    // Redirect to auth if not logged in
    if (!user) {
      redirectToAuth();
      return;
    }
  }, [user, authLoading, redirectToAuth]);

  // Handler for when access code is verified
  const handleAccessCodeVerified = useCallback((data: any) => {
    // Generate a session token (timestamp + random string)
    const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    updateSession({
      accessCodeData: data,
      isVerified: true,
      showPreSurveyUpload: true,
      sessionToken: token
    });
  }, [updateSession]);

  // Handler for when pre-survey upload is complete
  const handlePreSurveyUploadComplete = useCallback(() => {
    updateSession({ showPreSurveyUpload: false });
  }, [updateSession]);

  // Handler for when survey is complete
  const handleSurveyComplete = useCallback(async (responses: Record<string, any>) => {
    await baseSurveyComplete(responses, session.accessCodeData, clearSession);
  }, [baseSurveyComplete, session.accessCodeData, clearSession]);

  return {
    isCompleted,
    isVerified: session.isVerified,
    showPreSurveyUpload: session.showPreSurveyUpload,
    sessionToken: session.sessionToken,
    accessCodeData: session.accessCodeData,
    authLoading,
    user,
    getSurveyIdFromAccessCode,
    handleAccessCodeVerified,
    handlePreSurveyUploadComplete,
    handleSurveyComplete,
    handleExitAssessment,
    setIsVerified: (v: boolean) => updateSession({ isVerified: v }),
    setAccessCodeData: (data: any) => updateSession({ accessCodeData: data }),
    setSessionToken: (token: string) => updateSession({ sessionToken: token })
  };
};
