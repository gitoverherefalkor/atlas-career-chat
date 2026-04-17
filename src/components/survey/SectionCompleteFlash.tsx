
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SectionCompleteFlashProps {
  sectionTitle: string;
}

export const SectionCompleteFlash: React.FC<SectionCompleteFlashProps> = ({ sectionTitle }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-in zoom-in-95 fade-in duration-300 text-center">
        <CheckCircle2 className="h-16 w-16 text-atlas-teal mx-auto mb-4" />
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Section complete</p>
        <h2 className="text-2xl font-bold text-atlas-navy">{sectionTitle}</h2>
      </div>
    </div>
  );
};
