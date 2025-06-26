
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('Checking for resume data to pre-fill...');
      
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

          console.log('Profile data retrieved:', profile);
          console.log('Resume data type:', typeof profile?.resume_data);
          console.log('Resume data content:', profile?.resume_data);

          if (profile?.resume_data && typeof profile.resume_data === 'string') {
            console.log('Resume data is raw text, length:', profile.resume_data.length);
            console.log('First 200 characters:', profile.resume_data.substring(0, 200));
            
            const preFillData = extractDataFromResumeText(profile.resume_data);
            
            if (Object.keys(preFillData).length > 0) {
              console.log('Setting pre-fill data from raw text:', preFillData);
              setResponses(preFillData);
              toast({
                title: "Survey Pre-filled",
                description: `${Object.keys(preFillData).length} fields have been pre-filled from your resume. Please review and update as needed.`,
              });
            } else {
              console.log('No extractable data found in resume text');
              toast({
                title: "Resume Uploaded",
                description: "Your resume was processed but no specific fields could be automatically filled. You can reference your resume while filling out the survey.",
              });
            }
          } else {
            console.log('No resume data found in profile');
          }
        });
    }
  }, [isSessionLoaded, user, responses, setResponses, toast]);
};

const extractDataFromResumeText = (resumeText: string): Record<string, any> => {
  const preFillData: Record<string, any> = {};
  
  // Try to extract email
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    preFillData['email'] = emailMatch[0];
    console.log('Extracted email:', emailMatch[0]);
  }
  
  // Try to extract phone number
  const phoneMatch = resumeText.match(/(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) {
    preFillData['phone'] = phoneMatch[0];
    console.log('Extracted phone:', phoneMatch[0]);
  }
  
  // Look for common job titles
  const jobTitlePatterns = [
    /manager/i, /director/i, /analyst/i, /developer/i, /engineer/i, 
    /coordinator/i, /specialist/i, /consultant/i, /administrator/i
  ];
  
  for (const pattern of jobTitlePatterns) {
    const match = resumeText.match(new RegExp(`\\b\\w*${pattern.source}\\w*\\b`, 'i'));
    if (match) {
      preFillData['current_job_title'] = match[0];
      console.log('Extracted job title:', match[0]);
      break;
    }
  }
  
  return preFillData;
};
