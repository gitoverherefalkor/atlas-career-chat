
import { useAIResumePreFill } from './useAIResumePreFill';

export const useResumePreFill = (props: {
  isSessionLoaded: boolean;
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  surveyId: string;
}) => {
  // Resume data is the sole source of truth for pre-filling survey responses.
  // Previously had a fallback that pulled from auth user_metadata (Google/LinkedIn/signup name),
  // but it caused race conditions — the auth name would overwrite resume-parsed data
  // because both useEffects ran in the same render cycle before state updates applied.
  // Removed: if they skip the resume, fields start empty and they type manually.
  useAIResumePreFill(props);
};
