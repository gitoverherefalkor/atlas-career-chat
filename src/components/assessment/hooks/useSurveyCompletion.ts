
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSurveyIdFromAccessCode } from '../constants';

export const useSurveyCompletion = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const { user } = useAuth();
  const { createReport } = useReports();
  const { toast } = useToast();

  const handleSurveyComplete = async (
    responses: Record<string, any>, 
    accessCodeData: any,
    onSessionClear: () => void
  ) => {
    console.log('Survey completed with responses:', responses);
    
    if (!accessCodeData || !user) {
      console.error('Missing required data for survey completion:', { accessCodeData, user });
      toast({
        title: "Error",
        description: "Missing required data to complete survey.",
        variant: "destructive",
      });
      return;
    }
    
    const surveyId = getSurveyIdFromAccessCode(accessCodeData);
    
    try {
      await createReport({
        title: `Atlas Career Assessment - ${new Date().toLocaleDateString()}`,
        payload: {
          responses,
          accessCode: accessCodeData?.code,
          completedAt: new Date().toISOString(),
          surveyType: accessCodeData?.survey_type,
        },
        access_code_id: accessCodeData?.id,
        survey_id: surveyId,
      });

      // Update access code usage count
      if (accessCodeData?.id && accessCodeData.id !== 'existing-session') {
        await supabase
          .from('access_codes')
          .update({ 
            usage_count: (accessCodeData.usage_count || 0) + 1,
            used_at: new Date().toISOString(),
            user_id: user?.id
          })
          .eq('id', accessCodeData.id);
      }

      onSessionClear();
      
      toast({
        title: "Assessment Complete!",
        description: "Your assessment has been submitted successfully.",
      });
      
      setIsCompleted(true);
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Warning",
        description: "Assessment completed but failed to save report. Your responses were submitted successfully.",
        variant: "destructive",
      });
      setIsCompleted(true); // Still mark as completed even if report save failed
    }
  };

  return {
    isCompleted,
    handleSurveyComplete,
    setIsCompleted
  };
};
