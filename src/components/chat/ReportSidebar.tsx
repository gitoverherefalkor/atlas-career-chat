import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RevealedSection {
  id: string;
  title: string;
}

interface ReportSidebarProps {
  revealedSections: RevealedSection[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSectionClick: (sectionId: string) => void;
  currentSection?: string;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  revealedSections,
  isCollapsed,
  onToggleCollapse,
  onSectionClick,
  currentSection
}) => {
  if (revealedSections.length === 0) {
    return (
      <div className="w-64 bg-gray-50 border-l border-gray-200 flex items-center justify-center p-4">
        <p className="text-xs text-gray-400 text-center">Sections will appear here as you progress through the chat</p>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="hover:bg-atlas-blue/10"
        >
          <ChevronLeft className="h-4 w-4 text-atlas-navy" />
        </Button>
        <div className="flex flex-col space-y-2 items-center">
          {revealedSections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                onSectionClick(section.id);
                onToggleCollapse();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                currentSection === section.id
                  ? 'bg-atlas-teal text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={section.title}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-atlas-teal" />
          <h2 className="font-heading font-semibold text-atlas-navy text-sm">Sections</h2>
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

      {/* Section Navigation - Titles Only */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-1">
          {revealedSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentSection === section.id
                  ? 'bg-atlas-teal text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
