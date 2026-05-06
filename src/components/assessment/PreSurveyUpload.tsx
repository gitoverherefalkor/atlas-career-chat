import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2, Upload, FileText, CheckCircle, X, Info, ChevronDown, AlertTriangle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIResumeUpload } from '../resume/hooks/useAIResumeUpload';
import { useToast } from '@/hooks/use-toast';

interface PreSurveyUploadProps {
  onContinue: () => void;
}

// Animated illustration showing resume → auto-fill value proposition
const ResumeAutoFillAnimation = () => (
  <div className="max-w-md mx-auto mb-6">
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      {/* Step 1: Resume drops in */}
      <div className="flex flex-col items-center gap-1.5 animate-fade-in" style={{ animationDelay: '0s' }}>
        <div className="w-12 h-14 sm:w-14 sm:h-16 bg-white border-2 border-atlas-navy/20 rounded-lg flex items-center justify-center shadow-sm relative">
          <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-atlas-navy/70" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-atlas-teal rounded-full flex items-center justify-center">
            <Upload className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Upload</span>
      </div>

      {/* Arrow 1 */}
      <div className="text-atlas-teal/40 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>

      {/* Step 2: AI processing */}
      <div className="flex flex-col items-center gap-1.5 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="w-12 h-14 sm:w-14 sm:h-16 bg-gradient-to-br from-atlas-teal/10 to-atlas-blue/10 border-2 border-atlas-teal/20 rounded-lg flex items-center justify-center shadow-sm">
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-atlas-teal animate-pulse" />
        </div>
        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">AI reads</span>
      </div>

      {/* Arrow 2 */}
      <div className="text-atlas-teal/40 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>

      {/* Step 3: Auto-filled fields */}
      <div className="flex flex-col items-center gap-1.5 animate-fade-in" style={{ animationDelay: '1s' }}>
        <div className="w-28 sm:w-36 space-y-1.5 py-2">
          {['Job Titles', 'Skills', 'Achievements'].map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="h-2 rounded-full bg-atlas-teal/70 transition-all duration-1000"
                style={{
                  width: `${65 - i * 10}%`,
                  animation: `bar-fill 1.2s ease-out ${1.2 + i * 0.2}s both`
                }}
              />
              <span className="text-[9px] sm:text-[10px] text-gray-400 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Auto-filled</span>
      </div>
    </div>

    <style>{`
      @keyframes bar-fill {
        from { width: 0%; opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  </div>
);

export const PreSurveyUpload: React.FC<PreSurveyUploadProps> = ({ onContinue }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [hasUploadedResume, setHasUploadedResume] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [showLinkedInTip, setShowLinkedInTip] = React.useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
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
          description: `Extracted ${data.fieldsExtracted} fields from your resume.`,
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

  const validateAndSetFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File type not supported",
        description: "Please upload a PDF or Word document (.pdf, .doc, .docx).",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    setUploadedFile(file);
    setShowSkipConfirm(false);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
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

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const handleSkipConfirmed = () => {
    localStorage.setItem('pre_survey_upload_complete', 'true');
    onContinue();
  };

  const handleContinue = () => {
    localStorage.setItem('pre_survey_upload_complete', 'true');
    onContinue();
  };

  const isBusy = isProcessing || aiProcessing;
  const isContinueDisabled = isBusy || !hasUploadedResume;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Animated illustration above the card */}
        <ResumeAutoFillAnimation />

        <Card>
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-atlas-navy mb-2">
                Save Time with a Resume Upload
              </h1>
              <p className="text-gray-600">
                Upload your resume or CV to pre-fill work history, education, and skills
              </p>
            </div>

            {/* Info Alert */}
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-gray-700">
                Any pre-filled information can be edited or overwritten during the assessment.
              </AlertDescription>
            </Alert>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white'
              }`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && validateAndSetFile(file)) {
                  resetState();
                  setIsProcessing(true);
                  uploadAndProcess(file);
                }
              }}
            >
              {uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {hasProcessed ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <FileText className="h-8 w-8 text-atlas-gold" />
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
                    <div className="flex items-center justify-center space-x-2 text-sm text-atlas-gold">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Extracting information...</span>
                    </div>
                  )}

                  {hasProcessed && processingResult && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                      ✓ Extracted {processingResult.fieldsExtracted || 0} fields from your resume
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Upload className={`h-12 w-12 mx-auto transition-colors ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-700">
                      {isDragOver ? 'Drop your file here' : 'Drag & drop your resume or CV'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isDragOver ? '' : 'or click to browse \u00B7 PDF or Word documents up to 10MB'}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>

            {/* Skip Confirmation Warning */}
            {showSkipConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-3 w-full">
                    <div>
                      <p className="font-medium text-amber-900">Are you sure?</p>
                      <p className="text-sm text-amber-800 mt-1">
                        Uploading your resume saves you <strong>10-12 minutes</strong> of typing and improves the accuracy of your career recommendations.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowSkipConfirm(false);
                          fileInputRef.current?.click();
                        }}
                      >
                        Upload Resume
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSkipConfirmed}
                        className="text-amber-700 hover:text-amber-900"
                      >
                        Yes, skip anyway
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn Export Tip - Collapsible (hidden when skip confirm shows) */}
            {!showSkipConfirm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => setShowLinkedInTip(!showLinkedInTip)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-gray-700">
                    No resume handy? Use your LinkedIn profile export instead
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${showLinkedInTip ? 'rotate-180' : ''}`}
                  />
                </button>

                {showLinkedInTip && (
                  <div className="px-4 pb-4 pt-0">
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
                        <span>Upload the downloaded PDF here</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <img
                        src="/uploads/ad38b517-4c3f-47bd-b4f4-546e532e34cf.png"
                        alt="LinkedIn Resources menu showing Save to PDF option"
                        className="w-48 mx-auto rounded shadow-sm"
                      />
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        A LinkedIn export often has the most up-to-date version of your work history.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleSkipClick}
                disabled={isBusy}
                className="text-gray-500"
              >
                Skip this step
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isContinueDisabled}
                size="lg"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : hasUploadedResume ? (
                  <>
                    Continue to Assessment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Upload Resume to Continue
                    <Upload className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
