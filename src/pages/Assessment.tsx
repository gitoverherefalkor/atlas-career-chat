
import React from 'react';
import { SurveyForm } from '@/components/survey/SurveyForm';
import { AssessmentWelcome } from '@/components/survey/AssessmentWelcome';
import { AssessmentLayout } from '@/components/assessment/AssessmentLayout';
import { AssessmentCompletion } from '@/components/assessment/AssessmentCompletion';
import { SessionManager } from '@/components/assessment/SessionManager';
import { useAssessmentLogic } from '@/components/assessment/useAssessmentLogic';
import { useSearchParams } from 'react-router-dom';

const Assessment = () => {
  const [searchParams] = useSearchParams();
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

  const handleSessionValidated = ({ accessCodeData: validatedAccessCodeData, sessionToken: validatedSessionToken }: { accessCodeData: any; sessionToken: string }) => {
    setAccessCodeData(validatedAccessCodeData);
    setSessionToken(validatedSessionToken);
    setIsVerified(true);
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

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  if (isCompleted) {
    return <AssessmentCompletion />;
  }

  if (!isVerified || !sessionToken) {
    return (
      <SessionManager 
        searchParams={searchParams} 
        onSessionValidated={handleSessionValidated}
      >
        <AssessmentWelcome onVerified={handleAccessCodeVerified} prefilledCode={prefilledCode} />
      </SessionManager>
    );
  }

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
