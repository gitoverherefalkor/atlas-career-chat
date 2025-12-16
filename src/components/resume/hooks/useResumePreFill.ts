
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { extractDataFromResumeText } from '../utils/resumeTextExtractor';

interface UseResumePreFillProps {
  isSessionLoaded: boolean;
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any>) => void;
}

export const useResumePreFill = ({ isSessionLoaded, responses, setResponses }: UseResumePreFillProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isSessionLoaded && user && Object.keys(responses).length === 0) {
      supabase
        .from('profiles')
        .select('resume_data')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile, error }) => {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }

          if (profile?.resume_data && typeof profile.resume_data === 'string') {
            const preFillData = extractDataFromResumeText(profile.resume_data);

            if (Object.keys(preFillData).length > 0) {
              setResponses(preFillData);
              toast({
                title: "Survey Pre-filled",
                description: `${Object.keys(preFillData).length} fields have been pre-filled from your resume. Please review and update as needed.`,
              });
            } else {
              toast({
                title: "Resume Uploaded",
                description: "Your resume was processed but no specific fields could be automatically filled. You can reference your resume while filling out the survey.",
              });
            }
          }
        });
    }
  }, [isSessionLoaded, user, responses, setResponses, toast]);
};
