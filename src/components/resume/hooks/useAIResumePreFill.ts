
import { useEffect, useRef } from 'react';
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
  const hasRunRef = useRef(false);

  useEffect(() => {
    console.log('useAIResumePreFill effect triggered:', {
      isSessionLoaded,
      hasUser: !!user,
      responsesCount: Object.keys(responses).length,
      hasRun: hasRunRef.current
    });
    
    // Only run once when session loads, user is available, responses are empty, and hasn't run before
    if (isSessionLoaded && user && Object.keys(responses).length === 0 && !hasRunRef.current) {
      hasRunRef.current = true;
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
              console.log('Setting responses with parsed data:', parsedData);
              setResponses(parsedData);
              toast({
                title: "AI Pre-fill Complete! 🎉",
                description: `${Object.keys(parsedData).length} fields have been intelligently pre-filled from your resume using AI.`,
              });
            }
          }
        });
    }
  }, [isSessionLoaded, user?.id]); // Only depend on isSessionLoaded and user.id, not the full user object or responses

  // Reset the ref when user changes
  useEffect(() => {
    if (user?.id) {
      hasRunRef.current = false;
    }
  }, [user?.id]);
};
