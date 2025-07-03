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
        .select('resume_data')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile, error }) => {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }

          console.log('Profile data retrieved for pre-fill:', profile);

          // For now, we'll work with the raw resume_data and could potentially 
          // call AI parsing here if needed, but let's keep it simple
          if (profile?.resume_data && typeof profile.resume_data === 'string') {
            console.log('Raw resume data found, user can reference it during survey');
            toast({
              title: "Resume Available",
              description: "Your resume data is available. AI parsing will be enhanced once the database is updated.",
            });
          } else {
            console.log('No resume data found in profile');
          }
        });
    }
  }, [isSessionLoaded, user, responses, setResponses, toast]);
};
