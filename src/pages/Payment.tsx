import { useEffect, useState } from 'react';
import { CheckoutForm } from '../components/CheckoutForm';
import { useSurvey } from '../hooks/useSurvey';
import { getSurveyIdFromAccessCode, SURVEY_TYPE_MAPPING } from '../components/assessment/constants';

export default function Payment() {
  // Try to get accessCodeData from assessment session
  const defaultSurveyId = SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [surveyId, setSurveyId] = useState<string>(defaultSurveyId);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('assessment_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session?.accessCodeData) {
          setAccessCodeData(session.accessCodeData);
          setSurveyId(getSurveyIdFromAccessCode(session.accessCodeData));
        }
      }
    } catch {}
  }, []);

  const { data: survey } = useSurvey(surveyId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-atlas-blue/10 via-white to-atlas-navy/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-atlas-navy">
            You're making a smart move.
          </h2>
          <p className="text-base text-gray-600 max-w-md mx-auto">
            A small investment of time and money — for real clarity on where your career can go next.
          </p>
        </div>
        <CheckoutForm assessmentTitle={survey?.title || 'Atlas Career Assessment'} />
      </div>
    </div>
  );
} 