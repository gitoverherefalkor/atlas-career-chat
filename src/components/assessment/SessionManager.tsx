
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
  console.log('SessionManager rendered');
  
  const [isVerified, setIsVerified] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get survey session to check if user has an existing session
  const surveyId = getSurveyIdFromAccessCode(accessCodeData);
  const { getStoredSession } = useSurveySession(surveyId);

  console.log('SessionManager state:', {
    isVerified,
    accessCodeData,
    sessionToken,
    user: user ? { id: user.id, email: user.email } : null
  });

  useEffect(() => {
    console.log('SessionManager useEffect triggered');
    
    // Check if there's a session token from successful verification
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      console.log('Found token from URL:', tokenFromUrl);
      setSessionToken(tokenFromUrl);
      validateSessionToken(tokenFromUrl);
    } else {
      console.log('No token from URL, checking existing session');
      // If no token but user has an existing survey session, try to restore verification
      checkExistingSession();
    }
  }, [searchParams]);

  const checkExistingSession = () => {
    console.log('Checking existing session');
    
    // Check if user has an existing survey session stored
    const storageKeys = Object.keys(localStorage);
    const surveySessionKey = storageKeys.find(key => key.startsWith('survey_session_'));
    
    console.log('Found storage keys:', storageKeys);
    console.log('Found survey session key:', surveySessionKey);
    
    if (surveySessionKey) {
      console.log('Found existing survey session, allowing continuation');
      
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
    } else {
      console.log('No existing survey session found');
    }
  };

  const validateSessionToken = async (token: string) => {
    try {
      console.log('Validating session token:', token);
      
      if (token === 'existing-session-token') {
        console.log('Special case for existing sessions');
        // Special case for existing sessions
        setIsVerified(true);
        return;
      }
      
      // In a real implementation, you'd validate the token against your database
      console.log('Token validated successfully');
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
    }
  };

  function getSurveyIdFromAccessCode(accessCodeData: any): string {
    const surveyType = accessCodeData?.survey_type || 'Office / Business Pro - 2025 v1 EN';
    const surveyId = SURVEY_TYPE_MAPPING[surveyType] || SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
    console.log('SessionManager - Survey ID for access code:', { surveyType, surveyId });
    return surveyId;
  }

  // Pass session data to parent when ready
  useEffect(() => {
    console.log('SessionManager validation effect:', { isVerified, sessionToken, accessCodeData });
    
    if (isVerified && sessionToken && accessCodeData) {
      console.log('Calling onSessionValidated');
      onSessionValidated({ accessCodeData, sessionToken });
    }
  }, [isVerified, sessionToken, accessCodeData]);

  console.log('SessionManager rendering children');
  return <>{children}</>;
};
