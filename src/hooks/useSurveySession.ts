
import { useState, useEffect } from 'react';

interface SurveySession {
  responses: Record<string, any>;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  showSectionIntro: boolean;
  completedSections: number[];
  // Verification data
  isVerified?: boolean;
  accessCodeData?: any;
  sessionToken?: string;
  showPreSurveyUpload?: boolean;
}

export const useSurveySession = (surveyId: string, scopeId?: string) => {
  // Scope the storage key to the access code so two users (or two codes) on
  // the same browser never share a survey-progress slot. The unscoped key is
  // a defensive fallback only — the live flow always has an access code by
  // the time the survey renders.
  const sessionKey = scopeId
    ? `survey_session_${surveyId}_${scopeId}`
    : `survey_session_${surveyId}`;

  const getStoredSession = (): SurveySession | null => {
    try {
      const stored = localStorage.getItem(sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveSession = (session: SurveySession) => {
    try {
      localStorage.setItem(sessionKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save survey session:', error);
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(sessionKey);
    } catch (error) {
      console.error('Failed to clear survey session:', error);
    }
  };

  return {
    getStoredSession,
    saveSession,
    clearSession
  };
};
