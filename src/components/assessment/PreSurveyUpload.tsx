import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIResumeUploadCard } from '../resume/AIResumeUploadCard';

interface PreSurveyUploadProps {
  onContinue: () => void;
}

export const PreSurveyUpload: React.FC<PreSurveyUploadProps> = ({ onContinue }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [hasUploadedResume, setHasUploadedResume] = React.useState(false);

  const handleProcessingComplete = (data: any) => {
    if (data && data.surveyPreFillData) {
      sessionStorage.setItem('resume_parsed_data', JSON.stringify(data.surveyPreFillData));
      localStorage.setItem('resume_parsed_data', JSON.stringify(data.surveyPreFillData));
      localStorage.setItem('resume_parsed_timestamp', new Date().toISOString());
      setHasUploadedResume(true);
    } else if (data && data.aiParsedData) {
      sessionStorage.setItem('resume_parsed_data', JSON.stringify(data.aiParsedData));
      localStorage.setItem('resume_parsed_data', JSON.stringify(data.aiParsedData));
      localStorage.setItem('resume_parsed_timestamp', new Date().toISOString());
      setHasUploadedResume(true);
    }
    setIsProcessing(false);
  };

  const handleSkip = () => {
    localStorage.setItem('pre_survey_upload_complete', 'true');
    onContinue();
  };

  const handleContinue = () => {
    localStorage.setItem('pre_survey_upload_complete', 'true');
    onContinue();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-atlas-navy mb-2">
              Save Time with LinkedIn Import
            </h1>
            <p className="text-gray-600">
              Upload your LinkedIn profile export to pre-fill work history and education
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-gray-700">
              <strong>Important:</strong> This only works with LinkedIn PDF exports (not your own resume).
              Any pre-filled information can be edited or overwritten during the assessment.
            </AlertDescription>
          </Alert>

          {/* Upload Component - using original working component */}
          <div className="mb-6">
            <AIResumeUploadCard
              title="Upload File"
              description="Select your LinkedIn PDF export"
              showSuccessMessage={true}
              onProcessingComplete={handleProcessingComplete}
            />
          </div>

          {/* LinkedIn Export Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">How to export from LinkedIn:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="font-medium text-gray-900">1.</span>
                <span>Go to your LinkedIn profile</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium text-gray-900">2.</span>
                <span>Click "Resources" → "Save to PDF"</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium text-gray-900">3.</span>
                <span>Upload the PDF file above</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <img
                src="/lovable-uploads/ad38b517-4c3f-47bd-b4f4-546e532e34cf.png"
                alt="LinkedIn Resources menu"
                className="w-48 mx-auto rounded shadow-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isProcessing}
            >
              Skip (no LinkedIn or not up to date)
            </Button>
            <Button
              onClick={handleContinue}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Assessment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
