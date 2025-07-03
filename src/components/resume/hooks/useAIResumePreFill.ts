
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
        .select('resume_data, resume_parsed_data')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile, error }) => {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }

          console.log('Profile data retrieved for pre-fill:', profile);

          // Try to use structured AI-parsed data first
          if (profile?.resume_parsed_data && typeof profile.resume_parsed_data === 'object') {
            const parsedData = profile.resume_parsed_data as Record<string, any>;
            console.log('Using AI-parsed structured data:', parsedData);
            
            if (Object.keys(parsedData).length > 0) {
              setResponses(parsedData);
              toast({
                title: "AI Pre-fill Complete! 🎉",
                description: `${Object.keys(parsedData).length} fields have been intelligently pre-filled from your resume using AI.`,
              });
            } else {
              console.log('AI-parsed data is empty');
              toast({
                title: "Resume Available",
                description: "Your resume was processed but no fields could be automatically filled. You can reference it while completing the survey.",
              });
            }
          } else if (profile?.resume_data && typeof profile.resume_data === 'string') {
            console.log('Raw resume data found, but no AI-parsed data available');
            toast({
              title: "Resume Available",
              description: "Your resume data is available. Consider re-uploading for AI-powered pre-filling.",
            });
          } else {
            console.log('No resume data found in profile');
          }
        });
    }
  }, [isSessionLoaded, user, responses, setResponses, toast]);
};
