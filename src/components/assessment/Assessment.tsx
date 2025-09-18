import { AssessmentSessionProvider, useAssessmentSession } from './AssessmentSessionContext';
import React, { useCallback, useRef, useEffect, useReducer } from 'react';

const assessmentSteps = {
  VERIFY_ACCESS_CODE: 'VERIFY_ACCESS_CODE',
  PRE_SURVEY_UPLOAD: 'PRE_SURVEY_UPLOAD',
  TAKING_SURVEY: 'TAKING_SURVEY',
  COMPLETED: 'COMPLETED'
} as const;

type AssessmentStep = typeof assessmentSteps[keyof typeof assessmentSteps];

function stepReducer(state: AssessmentStep, action: { type: AssessmentStep }) {
  return action.type;
}

const AssessmentPage: React.FC = () => {
  const { session, updateSession, clearSession } = useAssessmentSession();
  const [step, dispatch] = useReducer(stepReducer, assessmentSteps.VERIFY_ACCESS_CODE);

  // Development-only infinite render guard
  if (process.env.NODE_ENV === 'development') {
    const renderCount = useRef(0);
    useEffect(() => {
      renderCount.current++;
      if (renderCount.current > 50) {
        console.error('Possible infinite render loop detected!');
      }
    });
  }

  // Example: stable callback for access code verification
  const handleAccessCodeVerified = useCallback((data: any) => {
    updateSession({ accessCodeData: data, isVerified: true, showPreSurveyUpload: true });
    dispatch({ type: assessmentSteps.PRE_SURVEY_UPLOAD });
  }, [updateSession]);

  // ... rest of the component logic, using session and updateSession instead of multiple hooks ...

  return (
    <div>
      {/* Render based on step and session state */}
    </div>
  );
};

const Assessment: React.FC = () => (
  <AssessmentSessionProvider>
    <AssessmentPage />
  </AssessmentSessionProvider>
);

export default Assessment; 