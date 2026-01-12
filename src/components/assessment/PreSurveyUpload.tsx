import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2, Upload, FileText, CheckCircle, X, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIResumeUpload } from '../resume/hooks/useAIResumeUpload';
import { useToast } from '@/hooks/use-toast';

interface PreSurveyUploadProps {
  onContinue: () => void;
}

export const PreSurveyUpload: React.FC<PreSurveyUploadProps> = ({ onContinue }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [hasUploadedResume, setHasUploadedResume] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    isUploading,
    isProcessing: aiProcessing,
    hasProcessed,
    processingResult,
    uploadAndProcess,
    resetState
  } = useAIResumeUpload({
    onSuccess: (data) => {
      if (data && data.surveyPreFillData) {
        sessionStorage.setItem('resume_parsed_data', JSON.stringify(data.surveyPreFillData));
        localStorage.setItem('resume_parsed_data', JSON.stringify(data.surveyPreFillData));
        localStorage.setItem('resume_parsed_timestamp', new Date().toISOString());
        setHasUploadedResume(true);
        toast({
          title: "Processing Complete",
          description: `Extracted ${data.fieldsExtracted} fields from your LinkedIn export.`,
        });
      } else if (data && data.aiParsedData) {
        sessionStorage.setItem('resume_parsed_data', JSON.stringify(data.aiParsedData));
        localStorage.setItem('resume_parsed_data', JSON.stringify(data.aiParsedData));
        localStorage.setItem('resume_parsed_timestamp', new Date().toISOString());
        setHasUploadedResume(true);
        toast({
          title: "Processing Complete",
          description: "Your information is ready to pre-fill the assessment.",
        });
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: error || "Failed to process your file. You can continue manually.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File type not supported",
        description: "Please upload a PDF, Word document, or plain text file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    resetState();
    setIsProcessing(true);
    uploadAndProcess(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setHasUploadedResume(false);
    resetState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const isContinueDisabled = isProcessing || aiProcessing;

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

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 bg-white">
            {uploadedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {hasProcessed ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <FileText className="h-8 w-8 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        {hasProcessed && " • Processed"}
                        {isProcessing && " • Processing..."}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isProcessing && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting information...</span>
                  </div>
                )}

                {hasProcessed && processingResult && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                    ✓ Extracted {processingResult.fieldsExtracted || 0} fields from your LinkedIn profile
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium text-gray-700">Upload your LinkedIn PDF export</p>
                  <p className="text-sm text-gray-500">PDF, Word, or text files up to 10MB</p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                />
              </div>
            )}
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
                <span>Upload the PDF file here</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <img
                src="/lovable-uploads/ad38b517-4c3f-47bd-b4f4-546e532e34cf.png"
                alt="LinkedIn Resources menu"
                className="w-48 mx-auto rounded shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                Since LinkedIn limits what data they share with other apps, this quick upload is the best way to ensure your full experience and skills are imported accurately.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isContinueDisabled}
            >
              Skip (no LinkedIn or not up to date)
            </Button>
            <Button
              onClick={handleContinue}
              disabled={isContinueDisabled}
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
