
import { useAIResumePreFill } from './useAIResumePreFill';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export const useResumePreFill = (props: {
  isSessionLoaded: boolean;
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  surveyId: string;
}) => {
  useAIResumePreFill(props);

  // Fallback: Prefill from Google/LinkedIn user_metadata if no resume prefill and responses are empty
  const { user } = useAuth();
  useEffect(() => {
    if (!props.isSessionLoaded) return;
    if (!user || !user.user_metadata) return;
    if (Object.keys(props.responses).length > 0) return;
    // Only prefill if no resume data in storage
    const sessionData = sessionStorage.getItem('resume_parsed_data');
    const localData = localStorage.getItem('resume_parsed_data');
    if (sessionData || localData) return;

    // Map user_metadata fields to survey question IDs
    const userMeta = user.user_metadata;
    const prefill: Record<string, any> = {
      '11111111-1111-1111-1111-11111111111a': userMeta.first_name || userMeta.given_name || userMeta.localizedFirstName || (userMeta.full_name ? userMeta.full_name.split(' ')[0] : ''),
      '11111111-1111-1111-1111-11111111111b': userMeta.pronoun || userMeta.pronouns || '',
      '11111111-1111-1111-1111-111111111113': userMeta.age || '',
      '11111111-1111-1111-1111-111111111114': userMeta.region || userMeta.location || userMeta.country || '',
      '11111111-1111-1111-1111-111111111116': userMeta.education || '',
      '11111111-1111-1111-1111-111111111117': userMeta.study_subject || userMeta.major || '',
      '11111111-1111-1111-1111-111111111118': userMeta.years_experience || '',
      // ... add more mappings as needed
    };
    // Remove empty values
    Object.keys(prefill).forEach(key => {
      if (!prefill[key]) delete prefill[key];
    });
    if (Object.keys(prefill).length > 0) {
      props.setResponses(prev => ({ ...prev, ...prefill }));
      console.log('[Google/LinkedIn prefill] Set responses from user_metadata:', prefill);
    }
  }, [props.isSessionLoaded, props.responses, props.setResponses, user]);
};
