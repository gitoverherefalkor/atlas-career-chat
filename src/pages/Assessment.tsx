
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SurveyForm } from '@/components/survey/SurveyForm';
import { AccessCodeVerification } from '@/components/survey/AccessCodeVerification';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Assessment = () => {
  const [searchParams] = useSearchParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<any>(null);
  const [prefilledCode, setPrefilledCode] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to take the assessment.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check if there's a pre-filled access code from the URL
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setPrefilledCode(codeFromUrl);
    }
  }, [searchParams, user, authLoading, navigate, toast]);

  const handleAccessCodeVerified = async (data: any) => {
    console.log('Access code verified:', data);
    
    try {
      // Link the access code to the current user
      const { error } = await supabase
        .from('access_codes')
        .update({ user_id: user?.id })
        .eq('id', data.id);

      if (error) {
        console.error('Error linking access code to user:', error);
        toast({
          title: "Error",
          description: "Failed to link access code to your account.",
          variant: "destructive",
        });
        return;
      }

      setAccessCodeData(data);
      setIsVerified(true);
    } catch (error) {
      console.error('Error linking access code:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleSurveyComplete = async (responses: Record<string, any>) => {
    console.log('Survey completed with responses:', responses);
    console.log('Using access code:', accessCodeData);
    
    try {
      // Create a report entry for this assessment
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user?.id,
          access_code_id: accessCodeData?.id,
          title: 'Atlas Career Assessment Report',
          status: 'processing'
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error creating report:', reportError);
        toast({
          title: "Warning",
          description: "Assessment submitted but report creation failed. Please contact support.",
          variant: "destructive",
        });
      } else {
        console.log('Report created:', reportData);
        toast({
          title: "Assessment Complete!",
          description: "Your report is being generated and will be available in your dashboard.",
        });
      }
    } catch (error) {
      console.error('Error creating report:', error);
    }
    
    setIsCompleted(true);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-atlas-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

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
              Thank you for completing the Atlas Career Assessment. Your personalized report is being generated and will be available in your dashboard shortly.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                View Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return <AccessCodeVerification onVerified={handleAccessCodeVerified} prefilledCode={prefilledCode} />;
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
