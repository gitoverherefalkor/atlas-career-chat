import React from 'react';
import { ChevronLeft, ChevronRight, FileText, Check, Circle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// All sections in order - matches store-report-sections
export const ALL_SECTIONS = [
  { id: 'executive-summary', title: 'Executive Summary', chapter: 'about-you' },
  { id: 'personality-team', title: 'Your Approach', chapter: 'about-you' },
  { id: 'strengths', title: 'Your Strengths', chapter: 'about-you' },
  { id: 'growth', title: 'Growth Opportunities', chapter: 'about-you' },
  { id: 'values', title: 'Career Values', chapter: 'about-you' },
  { id: 'first-career', title: 'Primary Career Match', chapter: 'career-suggestions' },
  { id: 'second-career', title: 'Second Career Match', chapter: 'career-suggestions' },
  { id: 'third-career', title: 'Third Career Match', chapter: 'career-suggestions' },
  { id: 'runner-up', title: 'Runner Up Career', chapter: 'career-suggestions' },
  { id: 'outside-box', title: 'Outside the Box', chapter: 'career-suggestions' },
  { id: 'dream-jobs', title: 'Dream Jobs', chapter: 'career-suggestions' },
] as const;

export type SectionId = typeof ALL_SECTIONS[number]['id'];

interface ReportSidebarProps {
  currentSectionIndex: number; // -1 = none started, 0 = first section, etc.
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSectionClick: (sectionId: string, index: number) => void;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  currentSectionIndex,
  isCollapsed,
  onToggleCollapse,
  onSectionClick
}) => {
  const getSectionState = (index: number): 'past' | 'current' | 'upcoming' => {
    if (index < currentSectionIndex) return 'past';
    if (index === currentSectionIndex) return 'current';
    return 'upcoming';
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4 space-y-2 fixed right-0 top-[73px] h-[calc(100vh-73px)] overflow-y-auto z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="hover:bg-atlas-blue/10 mb-2"
        >
          <ChevronLeft className="h-4 w-4 text-atlas-navy" />
        </Button>
        {ALL_SECTIONS.map((section, index) => {
          const state = getSectionState(index);
          const isPast = state === 'past';
          const isCurrent = state === 'current';

          return (
            <button
              key={section.id}
              onClick={() => isPast && onSectionClick(section.id, index)}
              disabled={!isPast}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-atlas-teal text-white ring-2 ring-atlas-teal/30'
                  : isPast
                    ? 'bg-atlas-teal/20 text-atlas-teal hover:bg-atlas-teal/30 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={section.title}
            >
              {isPast ? <Check className="h-3 w-3" /> : index + 1}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col fixed right-0 top-[73px] h-[calc(100vh-73px)] z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-atlas-teal" />
          <h2 className="font-heading font-semibold text-atlas-navy text-sm">Report Sections</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="hover:bg-atlas-blue/10"
        >
          <ChevronRight className="h-4 w-4 text-atlas-navy" />
        </Button>
      </div>

      {/* Section Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* About You Chapter */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About You</p>
          <div className="space-y-1">
            {ALL_SECTIONS.filter(s => s.chapter === 'about-you').map((section, idx) => {
              const globalIndex = idx;
              const state = getSectionState(globalIndex);
              return (
                <SectionButton
                  key={section.id}
                  section={section}
                  state={state}
                  onClick={() => state === 'past' && onSectionClick(section.id, globalIndex)}
                />
              );
            })}
          </div>
        </div>

        {/* Career Suggestions Chapter */}
        <div className="px-4 py-2 mt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Career Suggestions</p>
          <div className="space-y-1">
            {ALL_SECTIONS.filter(s => s.chapter === 'career-suggestions').map((section) => {
              const globalIndex = ALL_SECTIONS.findIndex(s => s.id === section.id);
              const state = getSectionState(globalIndex);
              return (
                <SectionButton
                  key={section.id}
                  section={section}
                  state={state}
                  onClick={() => state === 'past' && onSectionClick(section.id, globalIndex)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>{Math.max(0, currentSectionIndex + 1)} / {ALL_SECTIONS.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-atlas-teal rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, ((currentSectionIndex + 1) / ALL_SECTIONS.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Individual section button component
interface SectionButtonProps {
  section: typeof ALL_SECTIONS[number];
  state: 'past' | 'current' | 'upcoming';
  onClick: () => void;
}

const SectionButton: React.FC<SectionButtonProps> = ({ section, state, onClick }) => {
  const isPast = state === 'past';
  const isCurrent = state === 'current';
  const isUpcoming = state === 'upcoming';

  return (
    <button
      onClick={onClick}
      disabled={!isPast}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        isCurrent
          ? 'bg-atlas-teal text-white shadow-sm'
          : isPast
            ? 'text-atlas-navy hover:bg-atlas-teal/10 cursor-pointer'
            : 'text-gray-400 cursor-not-allowed'
      }`}
    >
      {/* Status icon */}
      <span className={`flex-shrink-0 ${isCurrent ? 'text-white' : isPast ? 'text-atlas-teal' : 'text-gray-300'}`}>
        {isPast && <Check className="h-4 w-4" />}
        {isCurrent && <Circle className="h-4 w-4 fill-current" />}
        {isUpcoming && <Lock className="h-3.5 w-3.5" />}
      </span>

      {/* Title */}
      <span className={isUpcoming ? 'opacity-60' : ''}>{section.title}</span>
    </button>
  );
};
