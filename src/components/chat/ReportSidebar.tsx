import React from 'react';
import { ChevronLeft, ChevronRight, FileText, Check, Circle, Lock, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

// All sections in order - matches store-report-sections
// Each section has: id, title (display), altTitles (what agent might output)
export const ALL_SECTIONS = [
  { id: 'executive-summary', title: 'Executive Summary', altTitles: ['executive summary'], chapter: 'about-you' },
  { id: 'personality-team', title: 'Your Approach', altTitles: ['your approach', 'personality', 'team dynamics'], chapter: 'about-you' },
  { id: 'strengths', title: 'Your Strengths', altTitles: ['your strengths', 'strengths'], chapter: 'about-you' },
  { id: 'growth', title: 'Development Areas', altTitles: ['development areas', 'areas for development', 'growth', 'growth opportunities'], chapter: 'about-you' },
  { id: 'values', title: 'Career Values', altTitles: ['career values', 'values', 'your values'], chapter: 'about-you' },
  { id: 'first-career', title: 'Primary Career Match', altTitles: ['primary career', 'first career', 'career match', 'career 1:', 'career 1'], chapter: 'career-suggestions' },
  { id: 'second-career', title: 'Second Career Match', altTitles: ['second career', 'secondary career', 'career 2:', 'career 2'], chapter: 'career-suggestions' },
  { id: 'third-career', title: 'Third Career Match', altTitles: ['third career', 'career 3:', 'career 3'], chapter: 'career-suggestions' },
  { id: 'runner-up', title: 'Runner-up Careers', altTitles: ['runner-up', 'runner up', 'honorable mention', 'honorable mentions'], chapter: 'career-suggestions' },
  { id: 'outside-box', title: 'Outside the Box', altTitles: ['outside the box', 'unconventional', 'wildcard'], chapter: 'career-suggestions' },
  { id: 'dream-jobs', title: 'Dream Job Assessment', altTitles: ['dream job', 'dream jobs', 'dream career'], chapter: 'career-suggestions' },
] as const;

export type SectionId = typeof ALL_SECTIONS[number]['id'];

// Pre-compute sections by chapter for cleaner rendering
const ABOUT_YOU_SECTIONS = ALL_SECTIONS
  .map((section, index) => ({ ...section, globalIndex: index }))
  .filter(s => s.chapter === 'about-you');

const CAREER_SECTIONS = ALL_SECTIONS
  .map((section, index) => ({ ...section, globalIndex: index }))
  .filter(s => s.chapter === 'career-suggestions');

interface ReportSidebarProps {
  currentSectionIndex: number; // -1 = none started, 0 = first section, etc.
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSectionClick: (sectionId: string, index: number) => void;
  onCompleteSession?: () => void; // Called when user clicks "Complete Session"
  isSessionCompleted?: boolean; // True when edge function has marked session complete
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  currentSectionIndex,
  isCollapsed,
  onToggleCollapse,
  onSectionClick,
  onCompleteSession,
  isSessionCompleted = false
}) => {
  // Determine section state based on current progress
  const getSectionState = (index: number): 'past' | 'current' | 'upcoming' => {
    if (index < currentSectionIndex) return 'past';
    if (index === currentSectionIndex) return 'current';
    return 'upcoming';
  };

  // Section is clickable if it's been reached (past or current)
  const isClickable = (index: number): boolean => {
    return index <= currentSectionIndex;
  };

  // Handle section click - delegate to parent
  const handleClick = (sectionId: string, index: number) => {
    if (isClickable(index)) {
      onSectionClick(sectionId, index);
    }
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
          const clickable = isClickable(index);

          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id, index)}
              disabled={!clickable}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                state === 'current'
                  ? 'bg-atlas-teal text-white ring-2 ring-atlas-teal/30 cursor-pointer hover:ring-atlas-teal/50'
                  : state === 'past'
                    ? 'bg-atlas-teal/20 text-atlas-teal hover:bg-atlas-teal/30 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={section.title}
            >
              {state === 'past' ? <Check className="h-3 w-3" /> : index + 1}
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
            {ABOUT_YOU_SECTIONS.map((section) => (
              <SectionButton
                key={section.id}
                title={section.title}
                state={getSectionState(section.globalIndex)}
                onClick={() => handleClick(section.id, section.globalIndex)}
                disabled={!isClickable(section.globalIndex)}
              />
            ))}
          </div>
        </div>

        {/* Career Suggestions Chapter */}
        <div className="px-4 py-2 mt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Career Suggestions</p>
          <div className="space-y-1">
            {CAREER_SECTIONS.map((section) => (
              <SectionButton
                key={section.id}
                title={section.title}
                state={getSectionState(section.globalIndex)}
                onClick={() => handleClick(section.id, section.globalIndex)}
                disabled={!isClickable(section.globalIndex)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Complete Session Button - shows when edge function marks session complete */}
      {isSessionCompleted && onCompleteSession && (
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <Button
            onClick={onCompleteSession}
            className="w-full bg-atlas-teal hover:bg-atlas-teal/90 text-white"
          >
            <PartyPopper className="h-4 w-4 mr-2" />
            Complete Session
          </Button>
        </div>
      )}

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

// Individual section button - simplified props
interface SectionButtonProps {
  title: string;
  state: 'past' | 'current' | 'upcoming';
  onClick: () => void;
  disabled: boolean;
}

const SectionButton: React.FC<SectionButtonProps> = ({ title, state, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        state === 'current'
          ? 'bg-atlas-teal text-white shadow-sm cursor-pointer hover:bg-atlas-teal/90'
          : state === 'past'
            ? 'text-atlas-navy hover:bg-atlas-teal/10 cursor-pointer'
            : 'text-gray-400 cursor-not-allowed'
      }`}
    >
      {/* Status icon */}
      <span className={`flex-shrink-0 ${
        state === 'current' ? 'text-white' : state === 'past' ? 'text-atlas-teal' : 'text-gray-300'
      }`}>
        {state === 'past' && <Check className="h-4 w-4" />}
        {state === 'current' && <Circle className="h-4 w-4 fill-current" />}
        {state === 'upcoming' && <Lock className="h-3.5 w-3.5" />}
      </span>

      {/* Title */}
      <span className={state === 'upcoming' ? 'opacity-60' : ''}>{title}</span>
    </button>
  );
};
