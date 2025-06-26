
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - exclude PDFs for now
      const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "File type not supported",
          description: "Please upload a Word document (.doc, .docx) or plain text file. PDF support coming soon!",
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
          description: "Your professional information has been extracted and will pre-fill your survey.",
        });
      }

    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process your resume. Please try again or continue manually.",
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
            Upload your Word document (.doc, .docx) or plain text resume. PDF support coming soon!
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
                    <span>Processing your resume...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Upload your document</p>
                  <p className="text-sm text-gray-500">Word (.doc, .docx) or plain text files, up to 5MB</p>
                  <p className="text-xs text-gray-400 mt-1">Processing will start automatically after upload</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.txt"
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
