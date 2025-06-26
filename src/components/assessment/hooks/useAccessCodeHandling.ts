
import { useState } from 'react';

export const useAccessCodeHandling = () => {
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showPreSurveyUpload, setShowPreSurveyUpload] = useState(false);

  const handleAccessCodeVerified = async (data: any, onSessionCreated: (token: string) => void) => {
    console.log('Access code verified:', data);
    
    if (!data) {
      console.error('No data received from access code verification');
      return;
    }
    
    const token = onSessionCreated();
    
    setAccessCodeData(data);
    setIsVerified(true);
    setShowPreSurveyUpload(true); // Show upload step after verification
  };

  const handlePreSurveyUploadComplete = () => {
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
