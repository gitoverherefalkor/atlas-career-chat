
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSurveySession } from '@/hooks/useSurveySession';
import { useToast } from '@/hooks/use-toast';

interface SessionManagerProps {
  searchParams: URLSearchParams;
  onSessionValidated: (data: { accessCodeData: any; sessionToken: string }) => void;
  children: React.ReactNode;
}

// Survey type mapping
const SURVEY_TYPE_MAPPING: Record<string, string> = {
  'Office / Business Pro - 2025 v1 EN': '00000000-0000-0000-0000-000000000001',
};

export const SessionManager: React.FC<SessionManagerProps> = ({
  searchParams,
  onSessionValidated,
  children
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get survey session to check if user has an existing session
  const surveyId = getSurveyIdFromAccessCode(accessCodeData);
  const { getStoredSession } = useSurveySession(surveyId);

  useEffect(() => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    // Check if there's a session token from successful verification
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setSessionToken(tokenFromUrl);
      validateSessionToken(tokenFromUrl);
    } else {
      // If no token but user has an existing survey session, try to restore verification
      checkExistingSession();
    }
  }, [searchParams]);

  const checkExistingSession = () => {
    try {
      // Check if user has an existing survey session stored
      const storageKeys = Object.keys(localStorage);
      const surveySessionKey = storageKeys.find(key => key.startsWith('survey_session_'));

      if (surveySessionKey) {
        // Create a mock access code data based on default survey type
        const mockAccessCodeData = {
          id: 'existing-session',
          code: 'EXISTING-SESSION',
          survey_type: 'Office / Business Pro - 2025 v1 EN',
          usage_count: 0
        };

        setAccessCodeData(mockAccessCodeData);
        setIsVerified(true);
        setSessionToken('existing-session-token');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateSessionToken = async (token: string) => {
    try {
      if (token === 'existing-session-token') {
        // Special case for existing sessions
        setIsVerified(true);
        setIsProcessing(false);
        return;
      }

      // In a real implementation, you'd validate the token against your database
      setIsVerified(true);
    } catch (error) {
      console.error('Invalid session token:', error);
      toast({
        title: "Session Expired",
        description: "Please verify your access code again.",
        variant: "destructive",
      });
      setSessionToken(null);
      setIsVerified(false);
    } finally {
      setIsProcessing(false);
    }
  };

  function getSurveyIdFromAccessCode(accessCodeData: any): string {
    const surveyType = accessCodeData?.survey_type || 'Office / Business Pro - 2025 v1 EN';
    const surveyId = SURVEY_TYPE_MAPPING[surveyType] || SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
    return surveyId;
  }

  // Pass session data to parent when ready
  useEffect(() => {
    if (isVerified && sessionToken && accessCodeData && !isProcessing) {
      onSessionValidated({ accessCodeData, sessionToken });
    }
  }, [isVerified, sessionToken, accessCodeData, isProcessing, onSessionValidated]);

  return <>{children}</>;
};
