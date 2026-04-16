import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, Lock, Loader2 } from 'lucide-react';
import { useAssessmentSession } from '@/components/assessment/AssessmentSessionContext';

interface Section {
  id: string;
  title: string;
}

interface SurveyNavigationProps {
  sections: Section[];
  currentSectionIndex: number;
  completedSections: number[];
  onSectionClick: (sectionIndex: number) => void;
}

// Small reassurance block — tells users their progress is safely stored and they can close
// the tab at any time. Briefly flashes a spinner when an actual save is triggered.
const AutoSaveNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { saveStatus } = useAssessmentSession();
  const isSaving = saveStatus === 'saving';

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 mt-2">
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin text-atlas-gold" />
        ) : (
          <CheckCircle className="h-3 w-3 text-atlas-gold" />
        )}
        <span>{isSaving ? 'Saving…' : 'Progress auto-saved'}</span>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-atlas-gold flex-shrink-0" />
        ) : (
          <CheckCircle className="h-4 w-4 text-atlas-gold flex-shrink-0" />
        )}
        <p className="text-sm font-medium text-atlas-navy">
          {isSaving ? 'Saving…' : 'Progress auto-saved'}
        </p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        You can safely close this tab and return later — your answers stay where you left off.
      </p>
    </div>
  );
};

export const SurveyNavigation: React.FC<SurveyNavigationProps> = ({
  sections,
  currentSectionIndex,
  completedSections,
  onSectionClick
}) => {
  const getSectionStatus = (sectionIndex: number) => {
    if (completedSections.includes(sectionIndex)) {
      return 'completed';
    } else if (sectionIndex === currentSectionIndex) {
      return 'current';
    } else if (sectionIndex <= currentSectionIndex) {
      return 'accessible';
    } else {
      return 'locked';
    }
  };

  const getSectionIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-atlas-gold" />;
      case 'current':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'accessible':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Lock className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <Card className="hidden md:block w-80 h-fit">
      <CardContent className="p-4">
        <h3 className="font-semibold text-atlas-navy mb-4">Survey Progress</h3>
        <div className="space-y-2">
          {sections.map((section, index) => {
            const status = getSectionStatus(index);
            const isClickable = status === 'completed' || status === 'accessible' || status === 'current';

            return (
              <div
                key={section.id}
                onClick={() => isClickable ? onSectionClick(index) : undefined}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isClickable
                    ? 'cursor-pointer hover:bg-gray-50'
                    : 'cursor-not-allowed'
                } ${
                  status === 'current' ? 'bg-atlas-teal/10 border border-atlas-teal/20' : ''
                }`}
              >
                {getSectionIcon(status)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    status === 'locked' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Section {index + 1}
                  </p>
                  <p className={`text-xs truncate ${
                    status === 'locked' ? 'text-gray-200' : 'text-gray-500'
                  }`}>
                    {section.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <AutoSaveNotice />
      </CardContent>
    </Card>
  );
};

// Compact mobile step indicator — shown only on small screens
export const MobileStepIndicator: React.FC<{
  sections: Section[];
  currentSectionIndex: number;
  completedSections: number[];
  onSectionClick: (sectionIndex: number) => void;
}> = ({ sections, currentSectionIndex, completedSections, onSectionClick }) => {
  const getSectionStatus = (sectionIndex: number) => {
    if (completedSections.includes(sectionIndex)) return 'completed';
    if (sectionIndex === currentSectionIndex) return 'current';
    if (sectionIndex <= currentSectionIndex) return 'accessible';
    return 'locked';
  };

  return (
    <div className="md:hidden py-3">
      <div className="flex items-center justify-center gap-2">
        {sections.map((section, index) => {
          const status = getSectionStatus(index);
          const isClickable = status === 'completed' || status === 'accessible' || status === 'current';

          return (
            <button
              key={section.id}
              onClick={() => isClickable ? onSectionClick(index) : undefined}
              disabled={!isClickable}
              title={`Section ${index + 1}: ${section.title}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                status === 'current'
                  ? 'bg-atlas-teal text-white ring-2 ring-atlas-teal/30 scale-110'
                  : status === 'completed'
                    ? 'bg-atlas-gold/20 text-atlas-gold'
                    : status === 'accessible'
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {status === 'completed' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </button>
          );
        })}
      </div>
      <AutoSaveNotice compact />
    </div>
  );
};
