import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Lock, LockOpen, Loader2, Mountain } from 'lucide-react';
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
  currentQuestionInSection?: number;
  totalQuestionsInSection?: number;
  /** When set, the autosave block is temporarily replaced by this encouragement message. */
  activeMilestone?: string | null;
}

// Encouragement message — temporarily takes the autosave block's place in the
// sidebar when the user crosses a progress milestone. Mustard card so it reads
// as a distinct, positive beat rather than blending into the survey chrome.
const MilestoneNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-4 pt-4 border-t border-gray-100 px-3">
    <div className="flex items-start gap-3 rounded-lg bg-atlas-gold p-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <Mountain className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium text-white leading-relaxed">{message}</p>
    </div>
  </div>
);

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

  // Aligned to match the section-item layout above: same horizontal padding (px-3),
  // same icon size (h-5 w-5), and the description is indented past the icon column
  // (pl-8 = icon width 20px + gap-3 12px) so it sits under the "Progress auto-saved" text.
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 px-3">
      <div className="flex items-center gap-3 mb-1">
        {isSaving ? (
          <Loader2 className="h-5 w-5 animate-spin text-atlas-gold flex-shrink-0" />
        ) : (
          <CheckCircle className="h-5 w-5 text-atlas-gold flex-shrink-0" />
        )}
        <p className="text-sm font-medium text-atlas-navy">
          {isSaving ? 'Saving…' : 'Progress auto-saved'}
        </p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed pl-8">
        Safe to close this tab and return later. Your answers stay where you left off.
      </p>
    </div>
  );
};

export const SurveyNavigation: React.FC<SurveyNavigationProps> = ({
  sections,
  currentSectionIndex,
  completedSections,
  onSectionClick,
  currentQuestionInSection,
  totalQuestionsInSection,
  activeMilestone
}) => {
  const getSectionStatus = (sectionIndex: number) => {
    // `current` wins over `completed` — the section you're working on shouldn't
    // display a completion checkmark until you've actually moved past it.
    if (sectionIndex === currentSectionIndex) {
      return 'current';
    } else if (completedSections.includes(sectionIndex)) {
      return 'completed';
    } else if (sectionIndex < currentSectionIndex) {
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
        return <LockOpen className="h-5 w-5 text-atlas-teal" />;
      case 'accessible':
        return <LockOpen className="h-5 w-5 text-atlas-teal" />;
      default:
        return <Lock className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <Card className="hidden md:block w-80 h-fit">
      <CardContent className="px-4 pt-6 pb-4">
        <div className="space-y-2">
          {sections.map((section, index) => {
            const status = getSectionStatus(index);
            const isClickable = status === 'completed' || status === 'accessible' || status === 'current';

            const showProgress =
              status === 'current' &&
              typeof currentQuestionInSection === 'number' &&
              typeof totalQuestionsInSection === 'number' &&
              totalQuestionsInSection > 0;
            const progressPct = showProgress
              ? Math.min(100, (currentQuestionInSection! / totalQuestionsInSection!) * 100)
              : 0;

            return (
              <div
                key={section.id}
                onClick={() => isClickable ? onSectionClick(index) : undefined}
                className={`p-3 rounded-lg transition-colors ${
                  isClickable
                    ? 'cursor-pointer hover:bg-gray-50'
                    : 'cursor-not-allowed'
                } ${
                  status === 'current' ? 'bg-atlas-teal/10 border border-atlas-teal/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {getSectionIcon(status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${
                        status === 'locked' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Section {index + 1}
                      </p>
                      {showProgress && (
                        <span className="text-xs font-semibold text-atlas-teal whitespace-nowrap">
                          Q{currentQuestionInSection} /{totalQuestionsInSection}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${
                      status === 'locked' ? 'text-gray-200' : 'text-gray-500'
                    }`}>
                      {section.title}
                    </p>
                  </div>
                </div>
                {showProgress && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white border border-atlas-teal/20">
                    <div
                      className="h-full bg-atlas-teal transition-all duration-500 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {activeMilestone ? <MilestoneNotice message={activeMilestone} /> : <AutoSaveNotice />}
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
    // Same rule as the desktop sidebar: the current section never shows a checkmark
    // even if it's already been added to completedSections on intro.
    if (sectionIndex === currentSectionIndex) return 'current';
    if (completedSections.includes(sectionIndex)) return 'completed';
    if (sectionIndex < currentSectionIndex) return 'accessible';
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
