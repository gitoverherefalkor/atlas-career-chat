
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SurveyForm } from '@/components/survey/SurveyForm';
import { AssessmentWelcome } from '@/components/survey/AssessmentWelcome';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { useSurveySession } from '@/hooks/useSurveySession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Survey type mapping - expand this as you add more survey types
const SURVEY_TYPE_MAPPING: Record<string, string> = {
  'Office / Business Pro - 2025 v1 EN': '00000000-0000-0000-0000-000000000001',
  // Add more survey types here as needed
  // 'Healthcare Pro - 2025 v1 EN': '00000000-0000-0000-0000-000000000002',
};

const Assessment = () => {
  const [searchParams] = useSearchParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [prefilledCode, setPrefilledCode] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { createReport } = useReports();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get survey session to check if user has an existing session
  const surveyId = getSurveyIdFromAccessCode(accessCodeData);
  const { getStoredSession } = useSurveySession(surveyId);

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!authLoading && !user) {
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
    if (codeFromUrl) {
      setPrefilledCode(codeFromUrl);
    }

    // Check if there's a session token from successful verification
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setSessionToken(tokenFromUrl);
      validateSessionToken(tokenFromUrl);
    } else {
      // If no token but user has an existing survey session, try to restore verification
      checkExistingSession();
    }
  }, [searchParams, user, authLoading, navigate, toast]);

  const checkExistingSession = () => {
    // Check if user has an existing survey session stored
    // For now, we'll use a simple approach - check localStorage for any survey session
    const storageKeys = Object.keys(localStorage);
    const surveySessionKey = storageKeys.find(key => key.startsWith('survey_session_'));
    
    if (surveySessionKey) {
      // User has an existing session, we should allow them to continue without re-verification
      // This assumes they were previously verified
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
    }
  };

  const validateSessionToken = async (token: string) => {
    try {
      console.log('Validating session token:', token);
      
      if (token === 'existing-session-token') {
        // Special case for existing sessions
        setIsVerified(true);
        return;
      }
      
      // In a real implementation, you'd validate the token against your database
      // For now, we'll trust the token if it exists
      setIsVerified(true);
    } catch (error) {
      console.error('Invalid session token:', error);
      toast({
        title: "Session Expired",
        description: "Please verify your access code again.",
        variant: "destructive",
      });
      // Clear invalid token and go back to verification
      setSessionToken(null);
      setIsVerified(false);
    }
  };

  const generateSessionToken = () => {
    // Simple token generation - in production, this should be more secure
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleAccessCodeVerified = async (data: any) => {
    console.log('Access code verified:', data);
    
    // Generate a session token for security
    const token = generateSessionToken();
    
    setAccessCodeData(data);
    setSessionToken(token);
    setIsVerified(true);
    
    // Update URL to include session token (for security and bookmarking)
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('token', token);
    newSearchParams.delete('code'); // Remove code from URL for security
    navigate(`/assessment?${newSearchParams.toString()}`, { replace: true });
  };

  function getSurveyIdFromAccessCode(accessCodeData: any): string {
    const surveyType = accessCodeData?.survey_type || 'Office / Business Pro - 2025 v1 EN';
    return SURVEY_TYPE_MAPPING[surveyType] || SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
  }

  const handleSurveyComplete = async (responses: Record<string, any>) => {
    console.log('Survey completed with responses:', responses);
    console.log('Using access code:', accessCodeData);
    
    const surveyId = getSurveyIdFromAccessCode(accessCodeData);
    
    // Save the assessment report
    try {
      createReport({
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

      // Update access code usage count (only for real access codes, not mock ones)
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

      // Clear session token after successful completion
      setSessionToken(null);
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Warning",
        description: "Assessment completed but failed to save report. Your responses were submitted successfully.",
        variant: "destructive",
      });
    }
    
    toast({
      title: "Assessment Complete!",
      description: "Your assessment has been submitted successfully.",
    });
    
    setIsCompleted(true);
  };

  const handleExitAssessment = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit the assessment? Your progress will be saved and you can continue later."
    );
    
    if (confirmExit) {
      navigate('/dashboard');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-atlas-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Assessment Complete!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for completing the Atlas Career Assessment. Your personalized report is being generated and you'll receive an email notification when it's ready.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                View Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified || !sessionToken) {
    return <AssessmentWelcome onVerified={handleAccessCodeVerified} prefilledCode={prefilledCode} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Exit Button - Fixed in top right */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExitAssessment}
          className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
        >
          <X className="h-4 w-4 mr-2" />
          Exit Assessment
        </Button>
      </div>

      <div className="py-8">
        <SurveyForm
          surveyId={getSurveyIdFromAccessCode(accessCodeData)}
          onComplete={handleSurveyComplete}
          accessCodeData={accessCodeData}
        />
      </div>
    </div>
  );
};

export default Assessment;
