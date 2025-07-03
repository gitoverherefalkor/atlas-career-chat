
import { useState, useEffect } from 'react';
import { useSurveySession } from '@/hooks/useSurveySession';

export const useAccessCodeHandling = () => {
  const { getStoredSession, saveSession } = useSurveySession('00000000-0000-0000-0000-000000000001');
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showPreSurveyUpload, setShowPreSurveyUpload] = useState(false);

  // Load verification status from session on mount
  useEffect(() => {
    const storedSession = getStoredSession();
    if (storedSession?.isVerified && storedSession?.accessCodeData) {
      console.log('Restoring verification status from session:', {
        isVerified: storedSession.isVerified,
        accessCodeData: storedSession.accessCodeData,
        showPreSurveyUpload: storedSession.showPreSurveyUpload
      });
      setAccessCodeData(storedSession.accessCodeData);
      setIsVerified(storedSession.isVerified);
      setShowPreSurveyUpload(storedSession.showPreSurveyUpload || false);
    }
  }, [getStoredSession]);

  // Save verification status whenever it changes
  useEffect(() => {
    if (isVerified && accessCodeData) {
      const storedSession = getStoredSession();
      const updatedSession = {
        ...storedSession,
        isVerified,
        accessCodeData,
        showPreSurveyUpload,
        responses: storedSession?.responses || {},
        currentSectionIndex: storedSession?.currentSectionIndex || 0,
        currentQuestionIndex: storedSession?.currentQuestionIndex || 0,
        showSectionIntro: storedSession?.showSectionIntro ?? true,
        completedSections: storedSession?.completedSections || []
      };
      console.log('Saving verification status to session:', updatedSession);
      saveSession(updatedSession);
    }
  }, [isVerified, accessCodeData, showPreSurveyUpload, getStoredSession, saveSession]);

  const handleAccessCodeVerified = async (data: any, onSessionCreated: (token: string) => void) => {
    console.log('Access code verified in assessment:', data);
    
    if (!data) {
      console.error('No data received from access code verification');
      return;
    }
    
    // Create session token
    const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onSessionCreated(token);
    
    // Update state to proceed to next step
    setAccessCodeData(data);
    setIsVerified(true);
    setShowPreSurveyUpload(true); // Show upload step after verification
    
    console.log('Assessment state updated after verification:', {
      accessCodeData: data,
      isVerified: true,
      showPreSurveyUpload: true
    });
  };

  const handlePreSurveyUploadComplete = () => {
    console.log('Pre-survey upload completed, proceeding to survey');
    setShowPreSurveyUpload(false);
  };

  return {
    accessCodeData,
    isVerified,
    showPreSurveyUpload,
    setAccessCodeData,
    setIsVerified,
    handleAccessCodeVerified,
    handlePreSurveyUploadComplete
  };
};
