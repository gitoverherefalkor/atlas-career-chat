
import { useState } from 'react';

export const useAccessCodeHandling = () => {
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showPreSurveyUpload, setShowPreSurveyUpload] = useState(false);

  const handleAccessCodeVerified = async (data: any, onSessionCreated: (token: string) => void) => {
    console.log('Access code verified in assessment:', data);
    
    if (!data) {
      console.error('No data received from access code verification');
      return;
    }
    
    // Create session token
    const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onSessionCreated(token);
    
    // Update state to proceed to next step
    setAccessCodeData(data);
    setIsVerified(true);
    setShowPreSurveyUpload(true); // Show upload step after verification
    
    console.log('Assessment state updated after verification:', {
      accessCodeData: data,
      isVerified: true,
      showPreSurveyUpload: true
    });
  };

  const handlePreSurveyUploadComplete = () => {
    console.log('Pre-survey upload completed, proceeding to survey');
    setShowPreSurveyUpload(false);
  };

  return {
    accessCodeData,
    isVerified,
    showPreSurveyUpload,
    setAccessCodeData,
    setIsVerified,
    handleAccessCodeVerified,
    handlePreSurveyUploadComplete
  };
};
