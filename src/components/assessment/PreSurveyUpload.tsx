
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, Loader2, X, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LinkedInGuide } from '@/components/profile/LinkedInGuide';

interface PreSurveyUploadProps {
  onContinue: () => void;
}

export const PreSurveyUpload: React.FC<PreSurveyUploadProps> = ({ onContinue }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      setHasProcessed(false);
      
      // Auto-process the file immediately after upload
      handleUploadAndProcess(file);
    }
  };

  const handleUploadAndProcess = async (fileToProcess?: File) => {
    const file = fileToProcess || uploadedFile;
    if (!file || !user) return;

    setIsUploading(true);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data?.extractedData) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            resume_data: data.extractedData,
            resume_uploaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        setHasProcessed(true);
        toast({
          title: "Resume processed successfully",
          description: "Your professional information has been extracted and will pre-fill relevant survey questions.",
        });
      }

    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process your resume. You can continue with the survey and fill in manually.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setHasProcessed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSkip = () => {
    onContinue();
  };

  // Continue button should be disabled while processing
  const isContinueDisabled = isProcessing;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-atlas-navy mb-4">
            Pre-fill Your Assessment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your LinkedIn profile PDF or resume to automatically populate information in the Intake section of your survey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LinkedInGuide />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Resume Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload LinkedIn PDF or your own recent resume if you do not have a detailed or updated LinkedIn resume.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2">
                        {hasProcessed && <CheckCircle className="h-6 w-6 text-green-600" />}
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="text-left">
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            {hasProcessed && " - Processed ✓"}
                            {isProcessing && " - Processing..."}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {isProcessing && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing your document...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium">Upload your document</p>
                        <p className="text-sm text-gray-500">LinkedIn PDF or resume (Word/PDF), up to 5MB</p>
                        <p className="text-xs text-gray-400 mt-1">Processing will start automatically after upload</p>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Select File
                      </Button>
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
              </div>
            </CardContent>
          </Card>
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
