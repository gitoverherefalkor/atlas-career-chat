
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LinkedInGuide } from '@/components/profile/LinkedInGuide';
import { AIResumeUploadCard } from '../resume/AIResumeUploadCard';

interface PreSurveyUploadProps {
  onContinue: () => void;
}

export const PreSurveyUpload: React.FC<PreSurveyUploadProps> = ({ onContinue }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [hasUploadedResume, setHasUploadedResume] = React.useState(false);

  const handleProcessingComplete = (data: any) => {
    // Store the survey prefill data (with correct question IDs) if available
    if (data && data.surveyPreFillData) {
      sessionStorage.setItem('resume_parsed_data', JSON.stringify(data.surveyPreFillData));
      localStorage.setItem('resume_parsed_data', JSON.stringify(data.surveyPreFillData));
      localStorage.setItem('resume_parsed_timestamp', new Date().toISOString());
      setHasUploadedResume(true);
    } else if (data && data.aiParsedData) {
      // Fallback to AI parsed data if surveyPreFillData not available
      sessionStorage.setItem('resume_parsed_data', JSON.stringify(data.aiParsedData));
      localStorage.setItem('resume_parsed_data', JSON.stringify(data.aiParsedData));
      localStorage.setItem('resume_parsed_timestamp', new Date().toISOString());
      setHasUploadedResume(true);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('pre_survey_upload_complete', 'true');
    onContinue();
  };

  const handleContinue = () => {
    localStorage.setItem('pre_survey_upload_complete', 'true');
    onContinue();
  };

  const isContinueDisabled = isProcessing;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-atlas-navy mb-4">
            AI-Powered Assessment Pre-fill
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume and let our AI intelligently extract information to automatically populate your assessment.
          </p>
          {hasUploadedResume && (
            <p className="text-green-600 mt-2">
              ✓ Resume processed successfully! Your information will be pre-filled in the assessment.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LinkedInGuide />
          <AIResumeUploadCard 
            title="AI Resume Processing"
            description="Our AI will intelligently analyze your resume and extract relevant information to pre-fill your assessment."
            showSuccessMessage={true}
            onProcessingComplete={handleProcessingComplete}
            onProcessingStart={() => setIsProcessing(true)}
            onProcessingEnd={() => setIsProcessing(false)}
          />
        </div>
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            size="lg"
            disabled={isContinueDisabled}
          >
            Skip for Now
          </Button>
          <Button 
            onClick={handleContinue}
            size="lg"
            className="flex items-center"
            disabled={isContinueDisabled}
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
      </div>
    </div>
  );
};
