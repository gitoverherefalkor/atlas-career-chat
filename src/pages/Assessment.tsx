
import React from 'react';
import { SurveyForm } from '@/components/survey/SurveyForm';
import { AssessmentWelcome } from '@/components/survey/AssessmentWelcome';
import { AssessmentLayout } from '@/components/assessment/AssessmentLayout';
import { AssessmentCompletion } from '@/components/assessment/AssessmentCompletion';
import { PreSurveyUpload } from '@/components/assessment/PreSurveyUpload';
import { useAssessmentLogic } from '@/components/assessment/useAssessmentLogic';
import { AssessmentSessionProvider } from '@/components/assessment/AssessmentSessionContext';

const AssessmentPage = () => {
  const {
    isCompleted,
    isVerified,
    showPreSurveyUpload,
    sessionToken,
    accessCodeData,
    authLoading,
    user,
    getSurveyIdFromAccessCode,
    handleAccessCodeVerified,
    handlePreSurveyUploadComplete,
    handleSurveyComplete,
    handleExitAssessment,
  } = useAssessmentLogic();

  // Check if pre-survey upload is complete (either uploaded or skipped)
  const preSurveyUploadComplete = localStorage.getItem('pre_survey_upload_complete') === 'true';

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Authentication required. Please sign in.</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return <AssessmentCompletion />;
  }

  if (!isVerified || !sessionToken) {
    return (
      <AssessmentWelcome 
        onVerified={handleAccessCodeVerified}
      />
    );
  }

  // Always show pre-survey upload step after verification, unless explicitly completed
  if (!preSurveyUploadComplete) {
    return <PreSurveyUpload onContinue={handlePreSurveyUploadComplete} />;
  }

  const surveyId = getSurveyIdFromAccessCode(accessCodeData);

  if (!surveyId) {
    console.error('No survey ID found');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: No survey found. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <AssessmentLayout onExit={handleExitAssessment}>
      <SurveyForm
        surveyId={surveyId}
        onComplete={handleSurveyComplete}
        accessCodeData={accessCodeData}
      />
    </AssessmentLayout>
  );
};

const Assessment = () => (
  <AssessmentSessionProvider>
    <AssessmentPage />
  </AssessmentSessionProvider>
);

export default Assessment;
