
import { useState, useEffect, useRef } from 'react';
import { useSurveySession } from '@/hooks/useSurveySession';

// DEPRECATED: Use AssessmentSessionContext instead
export const useAccessCodeHandling = () => {
  throw new Error('useAccessCodeHandling is deprecated. Use useAssessmentSession from AssessmentSessionContext instead.');
};
