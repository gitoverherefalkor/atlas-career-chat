
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Survey type mapping
const SURVEY_TYPE_MAPPING: Record<string, string> = {
  'Office / Business Pro - 2025 v1 EN': '00000000-0000-0000-0000-000000000001',
};

export const useAssessmentLogic = () => {
  console.log('useAssessmentLogic hook initialized');
  
  const [searchParams] = useSearchParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showPreSurveyUpload, setShowPreSurveyUpload] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [prefilledCode, setPrefilledCode] = useState<string | null>(null);
  
  const { user, isLoading: authLoading } = useAuth();
  const { createReport } = useReports();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('useAssessmentLogic state:', {
    isCompleted,
    isVerified,
    showPreSurveyUpload,
    accessCodeData,
    sessionToken,
    prefilledCode,
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
      console.log('No user, redirecting to auth');
      toast({
        title: "Authentication Required",
        description: "Please sign in to take the assessment.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check if there's a pre-filled access code from the URL
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && codeFromUrl !== prefilledCode) {
      console.log('Found code from URL:', codeFromUrl);
      setPrefilledCode(codeFromUrl);
    }
  }, [searchParams, user, authLoading, navigate, toast, prefilledCode]);

  const generateSessionToken = () => {
    const token = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log('Generated session token:', token);
    return token;
  };

  const handleAccessCodeVerified = async (data: any) => {
    console.log('Access code verified:', data);
    
    if (!data) {
      console.error('No data received from access code verification');
      return;
    }
    
    const token = generateSessionToken();
    
    setAccessCodeData(data);
    setSessionToken(token);
    setIsVerified(true);
    setShowPreSurveyUpload(true); // Show upload step after verification
    
    // Update URL to include session token
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('token', token);
    newSearchParams.delete('code');
    navigate(`/assessment?${newSearchParams.toString()}`, { replace: true });
  };

  const handlePreSurveyUploadComplete = () => {
    setShowPreSurveyUpload(false);
  };

  function getSurveyIdFromAccessCode(accessCodeData: any): string {
    if (!accessCodeData) {
      console.error('No access code data provided to getSurveyIdFromAccessCode');
      return SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
    }
    
    const surveyType = accessCodeData?.survey_type || 'Office / Business Pro - 2025 v1 EN';
    const surveyId = SURVEY_TYPE_MAPPING[surveyType] || SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
    console.log('Survey ID for access code:', { surveyType, surveyId });
    return surveyId;
  }

  const handleSurveyComplete = async (responses: Record<string, any>) => {
    console.log('Survey completed with responses:', responses);
    
    if (!accessCodeData || !user) {
      console.error('Missing required data for survey completion:', { accessCodeData, user });
      toast({
        title: "Error",
        description: "Missing required data to complete survey.",
        variant: "destructive",
      });
      return;
    }
    
    const surveyId = getSurveyIdFromAccessCode(accessCodeData);
    
    try {
      await createReport({
        title: `Atlas Career Assessment - ${new Date().toLocaleDateString()}`,
        payload: {
          responses,
          accessCode: accessCodeData?.code,
          completedAt: new Date().toISOString(),
          surveyType: accessCodeData?.survey_type,
        },
        access_code_id: accessCodeData?.id,
        survey_id: surveyId,
      });

      // Update access code usage count
      if (accessCodeData?.id && accessCodeData.id !== 'existing-session') {
        await supabase
          .from('access_codes')
          .update({ 
            usage_count: (accessCodeData.usage_count || 0) + 1,
            used_at: new Date().toISOString(),
            user_id: user?.id
          })
          .eq('id', accessCodeData.id);
      }

      setSessionToken(null);
      
      toast({
        title: "Assessment Complete!",
        description: "Your assessment has been submitted successfully.",
      });
      
      setIsCompleted(true);
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Warning",
        description: "Assessment completed but failed to save report. Your responses were submitted successfully.",
        variant: "destructive",
      });
      setIsCompleted(true); // Still mark as completed even if report save failed
    }
  };

  const handleExitAssessment = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit the assessment? Your progress will be saved and you can continue later."
    );
    
    if (confirmExit) {
      navigate('/dashboard');
    }
  };

  return {
    isCompleted,
    isVerified,
    showPreSurveyUpload,
    sessionToken,
    accessCodeData,
    prefilledCode,
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
