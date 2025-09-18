import { useEffect, useState } from 'react';
import { CheckoutForm } from '../components/CheckoutForm';
import { useSurvey } from '../hooks/useSurvey';
import { getSurveyIdFromAccessCode, SURVEY_TYPE_MAPPING } from '../components/assessment/constants';

export default function Payment() {
  // Try to get accessCodeData from the default session (first/only survey for now)
  const defaultSurveyId = SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
  const sessionKey = `survey_session_${defaultSurveyId}`;
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [surveyId, setSurveyId] = useState<string>(defaultSurveyId);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(sessionKey);
      if (stored) {
        const session = JSON.parse(stored);
        if (session?.accessCodeData) {
          setAccessCodeData(session.accessCodeData);
          setSurveyId(getSurveyIdFromAccessCode(session.accessCodeData));
        }
      }
    } catch {}
  }, []);

  const { data: survey, isLoading } = useSurvey(surveyId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-atlas-blue/10 via-white to-atlas-navy/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <h2 className="text-2xl font-bold text-atlas-navy text-center mb-2">
          {isLoading ? 'Loading assessment...' : survey?.title || 'Atlas Career Assessment'}
        </h2>
        <CheckoutForm assessmentTitle={survey?.title || 'Atlas Career Assessment'} />
      </div>
    </div>
  );
} 