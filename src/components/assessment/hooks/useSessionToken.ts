
import { useState, useEffect } from 'react';
import { useSurveySession } from '@/hooks/useSurveySession';

export const useSessionToken = () => {
  const { getStoredSession, saveSession } = useSurveySession('00000000-0000-0000-0000-000000000001');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session token from storage on mount
  useEffect(() => {
    const storedSession = getStoredSession();
    if (storedSession?.sessionToken) {
      console.log('Restoring session token from storage:', storedSession.sessionToken);
      setSessionToken(storedSession.sessionToken);
    }
  }, [getStoredSession]);

  // Save session token whenever it changes
  useEffect(() => {
    if (sessionToken) {
      const storedSession = getStoredSession();
      const updatedSession = {
        ...storedSession,
        sessionToken,
        responses: storedSession?.responses || {},
        currentSectionIndex: storedSession?.currentSectionIndex || 0,
        currentQuestionIndex: storedSession?.currentQuestionIndex || 0,
        showSectionIntro: storedSession?.showSectionIntro ?? true,
        completedSections: storedSession?.completedSections || []
      };
      console.log('Saving session token to storage:', updatedSession);
      saveSession(updatedSession);
    }
  }, [sessionToken, getStoredSession, saveSession]);

  const generateSessionToken = () => {
    const token = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log('Generated session token:', token);
    return token;
  };

  const createNewSession = () => {
    const token = generateSessionToken();
    setSessionToken(token);
    return token;
  };

  const clearSession = () => {
    setSessionToken(null);
  };

  return {
    sessionToken,
    setSessionToken,
    generateSessionToken,
    createNewSession,
    clearSession
  };
};
