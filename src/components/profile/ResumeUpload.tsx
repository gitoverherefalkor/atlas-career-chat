
import React from 'react';
import { ResumeUploadCard } from '../resume/ResumeUploadCard';

export const ResumeUpload = () => {
  return (
    <ResumeUploadCard 
      title="Resume Upload"
      description="Upload your PDF, Word document (.doc, .docx) or plain text resume."
      showSuccessMessage={true}
    />
  );
};
