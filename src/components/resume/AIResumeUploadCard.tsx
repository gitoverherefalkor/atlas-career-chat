
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, Loader2, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAIResumeUpload } from './hooks/useAIResumeUpload';

interface AIResumeUploadCardProps {
  onProcessingComplete?: (data: any) => void;
  title?: string;
  description?: string;
  showSuccessMessage?: boolean;
}

export const AIResumeUploadCard: React.FC<AIResumeUploadCardProps> = ({
  onProcessingComplete,
  title = "AI-Powered Resume Upload",
  description = "Upload your resume and let AI intelligently extract information to pre-fill your assessment.",
  showSuccessMessage = true
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    isUploading,
    isProcessing,
    hasProcessed,
    setHasProcessed,
    processingResult,
    uploadAndProcess,
    resetState
  } = useAIResumeUpload({
    onSuccess: (data) => {
      if (showSuccessMessage) {
        toast({
          title: "AI Processing Complete! 🎉",
          description: `Extracted ${data.fieldsExtracted} fields from your ${uploadedFile?.name} using AI. Ready to pre-fill your assessment!`,
        });
      }
      onProcessingComplete?.(data);
    },
    onError: (error) => {
      toast({
        title: "AI Processing failed",
        description: error || "Failed to process your resume with AI. You can continue manually.",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File type not supported",
        description: "Please upload a PDF, Word document (.doc, .docx) or plain text file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
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
    uploadAndProcess(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    resetState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-white/50">
            {uploadedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  {hasProcessed && <CheckCircle className="h-6 w-6 text-green-600" />}
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      {hasProcessed && ` - AI processed ✨`}
                      {isProcessing && " - AI processing..."}
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
                    <Sparkles className="h-4 w-4" />
                    <span>AI is intelligently parsing your document...</span>
                  </div>
                )}

                {hasProcessed && processingResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                    <div className="flex items-center space-x-2 text-green-800 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">AI Processing Complete!</span>
                    </div>
                    <div className="text-green-700 space-y-1">
                      <p>• Extracted {processingResult.fieldsExtracted || 0} relevant fields</p>
                      <p>• Processed {processingResult.wordCount || 0} words with AI</p>
                      <p>• Ready to intelligently pre-fill survey questions</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Upload className="h-12 w-12 text-blue-400 mx-auto" />
                    <Sparkles className="h-6 w-6 text-blue-600 absolute -top-1 -right-1" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium">Upload for AI Processing</p>
                  <p className="text-sm text-gray-500">PDF, Word (.doc, .docx) or plain text files, up to 10MB</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">✨ AI will intelligently extract relevant information</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Select File for AI Processing
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
        </div>
      </CardContent>
    </Card>
  );
};
