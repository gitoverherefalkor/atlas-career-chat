
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const ResumeUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - accept PDFs, Word docs, and text files
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "File type not supported",
          description: "Please upload a PDF, Word document (.doc, .docx) or plain text file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB max for PDFs)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      setHasProcessed(false);
      setProcessingResult(null);
      
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

      console.log('Parse resume response:', data);
      setProcessingResult(data);

      if (data?.success && data?.extractedText) {
        // Check if we got meaningful content
        const wordCount = data.wordCount || 0;
        const charCount = data.contentLength || 0;
        
        if (wordCount > 20 && charCount > 100) {
          setHasProcessed(true);
          toast({
            title: "Resume processed successfully! ✅",
            description: `Extracted ${wordCount} words from your ${file.name}. Your professional information is ready to pre-fill survey questions.`,
          });

          // Store the extracted data in the profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              resume_data: data.extractedText,
              resume_uploaded_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            console.warn('Failed to save resume data to profile:', updateError);
            // Don't throw error, file was still processed successfully
          }
        } else {
          throw new Error(`Document processed but contains very little text (${wordCount} words). Please ensure your resume has readable content.`);
        }
      } else {
        throw new Error(data?.error || 'Failed to extract text from document');
      }

    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process your resume. Please try again or continue manually.",
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
    setProcessingResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
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
            Upload your PDF, Word document (.doc, .docx) or plain text resume.
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
                      {hasProcessed && " - Successfully processed ✓"}
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
                    <span>Processing your resume...</span>
                  </div>
                )}

                {hasProcessed && processingResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                    <div className="flex items-center space-x-2 text-green-800 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Document successfully parsed!</span>
                    </div>
                    <div className="text-green-700 space-y-1">
                      <p>• Extracted {processingResult.wordCount || 0} words</p>
                      <p>• Method: {processingResult.processingMethod || 'Text extraction'}</p>
                      <p>• Your information is ready to pre-fill survey questions</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Upload your document</p>
                  <p className="text-sm text-gray-500">PDF, Word (.doc, .docx) or plain text files, up to 10MB</p>
                  <p className="text-xs text-gray-400 mt-1">Processing will start automatically after upload</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
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
        </div>
      </CardContent>
    </Card>
  );
};
