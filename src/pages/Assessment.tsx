
import React from 'react';
import { SurveyForm } from '@/components/survey/SurveyForm';
import { AssessmentWelcome } from '@/components/survey/AssessmentWelcome';
import { AssessmentLayout } from '@/components/assessment/AssessmentLayout';
import { AssessmentCompletion } from '@/components/assessment/AssessmentCompletion';
import { SessionManager } from '@/components/assessment/SessionManager';
import { useAssessmentLogic } from '@/components/assessment/useAssessmentLogic';
import { useSearchParams } from 'react-router-dom';

const Assessment = () => {
  console.log('Assessment component rendered');
  
  const [searchParams] = useSearchParams();
  console.log('Search params:', Object.fromEntries(searchParams.entries()));
  
  const {
    isCompleted,
    isVerified,
    sessionToken,
    accessCodeData,
    prefilledCode,
    authLoading,
    user,
    getSurveyIdFromAccessCode,
    handleAccessCodeVerified,
    handleSurveyComplete,
    handleExitAssessment,
    setIsVerified,
    setAccessCodeData,
    setSessionToken
  } = useAssessmentLogic();

  console.log('Assessment state:', {
    isCompleted,
    isVerified,
    sessionToken,
    accessCodeData,
    prefilledCode,
    authLoading,
    user: user ? { id: user.id, email: user.email } : null
  });

  const handleSessionValidated = ({ accessCodeData: validatedAccessCodeData, sessionToken: validatedSessionToken }: { accessCodeData: any; sessionToken: string }) => {
    console.log('Session validated:', { validatedAccessCodeData, validatedSessionToken });
    setAccessCodeData(validatedAccessCodeData);
    setSessionToken(validatedSessionToken);
    setIsVerified(true);
  };

  // Show loading while checking auth
  if (authLoading) {
    console.log('Showing auth loading');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-atlas-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    console.log('No user, returning null');
    return null;
  }

  if (isCompleted) {
    console.log('Assessment completed, showing completion');
    return <AssessmentCompletion />;
  }

  if (!isVerified || !sessionToken) {
    console.log('Not verified or no session token, showing session manager');
    return (
      <SessionManager 
        searchParams={searchParams} 
        onSessionValidated={handleSessionValidated}
      >
        <AssessmentWelcome onVerified={handleAccessCodeVerified} prefilledCode={prefilledCode} />
      </SessionManager>
    );
  }

  console.log('Showing survey form');
  return (
    <AssessmentLayout onExit={handleExitAssessment}>
      <SurveyForm
        surveyId={getSurveyIdFromAccessCode(accessCodeData)}
        onComplete={handleSurveyComplete}
        accessCodeData={accessCodeData}
      />
    </AssessmentLayout>
  );
};

export default Assessment;
