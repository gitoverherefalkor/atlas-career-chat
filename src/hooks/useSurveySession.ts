
import { useState, useEffect } from 'react';

interface SurveySession {
  responses: Record<string, any>;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  showSectionIntro: boolean;
  completedSections: number[];
}

export const useSurveySession = (surveyId: string) => {
  const sessionKey = `survey_session_${surveyId}`;

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
