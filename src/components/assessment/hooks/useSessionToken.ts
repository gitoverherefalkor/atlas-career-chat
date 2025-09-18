
import { useState, useEffect, useRef } from 'react';
import { useSurveySession } from '@/hooks/useSurveySession';

// DEPRECATED: Use AssessmentSessionContext instead
export const useSessionToken = () => {
  throw new Error('useSessionToken is deprecated. Use useAssessmentSession from AssessmentSessionContext instead.');
};
