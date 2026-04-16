import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface SessionData {
  sessionToken: string | null;
  accessCodeData: any;
  isVerified: boolean;
  showPreSurveyUpload: boolean;
  responses: Record<string, any>;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  showSectionIntro: boolean;
  completedSections: string[];
}

type SaveStatus = 'idle' | 'saving' | 'saved';

interface SessionContextType {
  session: SessionData;
  updateSession: (updates: Partial<SessionData>) => void;
  clearSession: () => void;
  saveStatus: SaveStatus;
  triggerSave: () => void;
}

const defaultSession: SessionData = {
  sessionToken: null,
  accessCodeData: null,
  isVerified: false,
  showPreSurveyUpload: false,
  responses: {},
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  showSectionIntro: true,
  completedSections: []
};

const AssessmentSessionContext = createContext<SessionContextType | undefined>(undefined);

export const AssessmentSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData>(defaultSession);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);
  const lastSavedSession = useRef<string>('');

  // Load session once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      const stored = localStorage.getItem('assessment_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSession(parsed);
          lastSavedSession.current = stored;
        } catch (e) {
          console.error('Failed to parse stored session:', e);
        }
      }
      isInitialized.current = true;
    }
  }, []);

  // Save session only when it changes
  useEffect(() => {
    if (isInitialized.current) {
      const serialized = JSON.stringify(session);
      if (serialized !== lastSavedSession.current) {
        localStorage.setItem('assessment_session', serialized);
        lastSavedSession.current = serialized;
      }
    }
  }, [session]);

  const updateSession = (updates: Partial<SessionData>) => {
    setSession(prev => ({ ...prev, ...updates }));
  };

  const clearSession = () => {
    localStorage.removeItem('assessment_session');
    setSession(defaultSession);
    lastSavedSession.current = '';
  };

  // Flash a brief "saving" state then settle into "saved"
  const triggerSave = () => {
    if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    setSaveStatus('saving');
    savingTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 500);
  };

  return (
    <AssessmentSessionContext.Provider value={{ session, updateSession, clearSession, saveStatus, triggerSave }}>
      {children}
    </AssessmentSessionContext.Provider>
  );
};

export const useAssessmentSession = () => {
  const context = useContext(AssessmentSessionContext);
  if (!context) {
    throw new Error('useAssessmentSession must be used within AssessmentSessionProvider');
  }
  return context;
}; 