
import React, { useState } from 'react';
import { SurveyForm } from '@/components/survey/SurveyForm';
import { AccessCodeVerification } from '@/components/survey/AccessCodeVerification';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Assessment = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const navigate = useNavigate();

  const handleAccessCodeVerified = (data: any) => {
    console.log('Access code verified:', data);
    setAccessCodeData(data);
    setIsVerified(true);
  };

  const handleSurveyComplete = (responses: Record<string, any>) => {
    console.log('Survey completed with responses:', responses);
    console.log('Using access code:', accessCodeData);
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Assessment Complete!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for completing the Atlas Career Assessment. Your responses have been recorded and will be analyzed to provide you with personalized career insights.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return <AccessCodeVerification onVerified={handleAccessCodeVerified} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SurveyForm
        surveyId="00000000-0000-0000-0000-000000000001"
        onComplete={handleSurveyComplete}
        accessCodeData={accessCodeData}
      />
    </div>
  );
};

export default Assessment;
