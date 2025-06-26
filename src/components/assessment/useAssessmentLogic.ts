
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSurveyIdFromAccessCode } from './constants';
import { useSessionToken } from './hooks/useSessionToken';
import { useAccessCodeHandling } from './hooks/useAccessCodeHandling';
import { useSurveyCompletion } from './hooks/useSurveyCompletion';
import { useAssessmentNavigation } from './hooks/useAssessmentNavigation';

export const useAssessmentLogic = () => {
  console.log('useAssessmentLogic hook initialized');
  
  const { user, isLoading: authLoading } = useAuth();
  const { redirectToAuth } = useAssessmentNavigation();
  
  const {
    sessionToken,
    setSessionToken,
    createNewSession,
    clearSession
  } = useSessionToken();
  
  const {
    accessCodeData,
    isVerified,
    showPreSurveyUpload,
    setAccessCodeData,
    setIsVerified,
    handleAccessCodeVerified: baseHandleAccessCodeVerified,
    handlePreSurveyUploadComplete
  } = useAccessCodeHandling();
  
  const {
    isCompleted,
    handleSurveyComplete: baseSurveyComplete
  } = useSurveyCompletion();
  
  const { handleExitAssessment } = useAssessmentNavigation();

  console.log('useAssessmentLogic state:', {
    isCompleted,
    isVerified,
    showPreSurveyUpload,
    accessCodeData,
    sessionToken,
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

  const handleAccessCodeVerified = async (data: any) => {
    await baseHandleAccessCodeVerified(data, createNewSession);
  };

  const handleSurveyComplete = async (responses: Record<string, any>) => {
    await baseSurveyComplete(responses, accessCodeData, clearSession);
  };

  return {
    isCompleted,
    isVerified,
    showPreSurveyUpload,
    sessionToken,
    accessCodeData,
    authLoading,
    user,
    getSurveyIdFromAccessCode,
    handleAccessCodeVerified,
    handlePreSurveyUploadComplete,
    handleSurveyComplete,
    handleExitAssessment,
    setIsVerified,
    setAccessCodeData,
    setSessionToken
  };
};
