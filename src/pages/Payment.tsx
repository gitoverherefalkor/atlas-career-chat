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
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#213F4F] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic teal glow — same warmth as the landing-page hero */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-atlas-teal/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] bg-atlas-teal/15 rounded-full blur-[120px] -mr-64 -mt-64" />

      <div className="relative w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-atlas-teal">
            You're making a smart move.
          </h2>
          <p className="text-base text-gray-300 max-w-md mx-auto">
            A small investment of time and money for real clarity on where your career can go next.
          </p>
        </div>
        <CheckoutForm assessmentTitle={survey?.title || 'Atlas Career Assessment'} />
      </div>
    </div>
  );
} 