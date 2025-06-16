
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AssessmentLayoutProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({
  children,
  onExit
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Exit Button - Fixed in top right */}
      <div className="fixed top-4 right-4 z-50">
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
