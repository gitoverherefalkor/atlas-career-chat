
import React from 'react';

interface AssessmentLayoutProps {
  children: React.ReactNode;
  // Kept optional for backwards compatibility with callers, but no longer rendered.
  // We don't encourage users to exit partway through — the auto-save indicator in the
  // Survey Progress panel tells them it's safe to close the tab instead.
  onExit?: () => void;
}

export const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        {children}
      </div>
    </div>
  );
};
