
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Loader2 } from 'lucide-react';
import { useAssessmentSession } from './AssessmentSessionContext';

interface AssessmentLayoutProps {
  children: React.ReactNode;
  onExit: () => void;
}

const SaveIndicator: React.FC = () => {
  const { saveStatus } = useAssessmentSession();

  if (saveStatus === 'idle') {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md px-2.5 py-1.5 transition-opacity duration-200"
      aria-live="polite"
    >
      {saveStatus === 'saving' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-atlas-teal" />
          <span>Saving…</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span>Auto-saved progress</span>
        </>
      )}
    </div>
  );
};

export const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({
  children,
  onExit
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Exit Button + Save Indicator - Fixed in top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <SaveIndicator />
        <Button
          variant="outline"
          size="sm"
          onClick={onExit}
          className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
        >
          <X className="h-4 w-4 mr-2" />
          Exit Assessment
        </Button>
      </div>

      <div className="py-8">
        {children}
      </div>
    </div>
  );
};
