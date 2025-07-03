
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseAIResumePreFillProps {
  isSessionLoaded: boolean;
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any>) => void;
}

export const useAIResumePreFill = ({ isSessionLoaded, responses, setResponses }: UseAIResumePreFillProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isSessionLoaded && user && Object.keys(responses).length === 0) {
      console.log('Checking for AI-parsed resume data to pre-fill...');
      
      supabase
        .from('profiles')
        .select('resume_parsed_data, resume_data')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile, error }) => {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }

          console.log('Profile data retrieved for pre-fill:', profile);

          // First try AI-parsed data (structured)
          if (profile?.resume_parsed_data && typeof profile.resume_parsed_data === 'object') {
            console.log('Using AI-parsed structured data:', profile.resume_parsed_data);
            
            const preFillData = profile.resume_parsed_data as Record<string, any>;
            const fieldCount = Object.keys(preFillData).length;
            
            if (fieldCount > 0) {
              console.log('Setting AI pre-fill data:', preFillData);
              setResponses(preFillData);
              toast({
                title: "Survey Pre-filled with AI! 🤖",
                description: `${fieldCount} fields have been intelligently filled from your resume. Please review and update as needed.`,
              });
              return;
            }
          }

          // Fallback: if no AI data but raw text exists, inform user
          if (profile?.resume_data && typeof profile.resume_data === 'string') {
            console.log('Raw resume data found but no AI parsing available');
            toast({
              title: "Resume Uploaded",
              description: "Your resume was processed but AI parsing wasn't available. You can reference your resume while filling out the survey.",
            });
          } else {
            console.log('No resume data found in profile');
          }
        });
    }
  }, [isSessionLoaded, user, responses, setResponses, toast]);
};
