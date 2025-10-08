import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReportSections } from '@/hooks/useReportSections';

interface ReportSection {
  title: string;
  content: string;
  id: string;
}

interface ReportSidebarProps {
  reportData: any;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentSection?: string;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  reportData,
  isCollapsed,
  onToggleCollapse,
  currentSection
}) => {
  const [activeSection, setActiveSection] = useState<string>('executive-summary');

  // Fetch report sections from database
  const { sections: dbSections, isLoading } = useReportSections(reportData?.id);

  // Map database sections to display sections
  const sections: ReportSection[] = useMemo(() => {
    if (!dbSections || dbSections.length === 0) return [];

    const sectionMap: Record<string, ReportSection> = {};

    dbSections.forEach(section => {
      // Use section_id as the key (e.g., 'executive-summary', 'personality-team', etc.)
      const key = section.section_id || section.id;
      const title = section.title || 'Untitled Section';

      if (!sectionMap[key]) {
        sectionMap[key] = {
          id: key,
          title: title,
          content: section.content
        };
      }
    });

    return Object.values(sectionMap);
  }, [dbSections]);

  if (isLoading) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading report...</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500 text-center">No report sections available yet.</p>
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
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                onToggleCollapse();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                activeSection === section.id || currentSection === section.id
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
    <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-atlas-teal" />
          <h2 className="font-heading font-semibold text-atlas-navy">Your Report</h2>
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
      <div className="p-3 bg-white border-b border-gray-200">
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-atlas-teal text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`${activeSection === section.id ? 'block' : 'hidden'}`}
          >
            <h3 className="font-heading text-lg font-semibold text-atlas-navy mb-3">
              {section.title}
            </h3>
            <div className="prose prose-sm max-w-none prose-headings:text-atlas-navy prose-p:text-gray-700 prose-strong:text-atlas-navy prose-ul:text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
