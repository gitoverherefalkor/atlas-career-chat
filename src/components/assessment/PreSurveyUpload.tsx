
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LinkedInGuide } from '@/components/profile/LinkedInGuide';
import { ResumeUploadCard } from '../resume/ResumeUploadCard';

interface PreSurveyUploadProps {
  onContinue: () => void;
}

export const PreSurveyUpload: React.FC<PreSurveyUploadProps> = ({ onContinue }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleProcessingComplete = (data: any) => {
    console.log('Resume processing completed:', data);
    // Could add additional logic here if needed
  };

  const handleSkip = () => {
    onContinue();
  };

  const isContinueDisabled = isProcessing;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-atlas-navy mb-4">
            Pre-fill Your Assessment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume to automatically populate information in the Intake section of your survey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LinkedInGuide />
          
          <ResumeUploadCard 
            title="Resume Upload"
            description="Upload your PDF, Word document (.doc, .docx) or plain text resume."
            showSuccessMessage={true}
            onProcessingComplete={handleProcessingComplete}
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
            onClick={onContinue}
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
