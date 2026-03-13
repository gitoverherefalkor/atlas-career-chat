
import React from 'react';
import { Check } from 'lucide-react';
import { ReportSection } from '@/hooks/useReportSections';

interface Career {
  id: string;
  title: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  isCollapsible?: boolean;
  careers?: Career[];
}

interface GroupedSections {
  [uiSectionId: string]: ReportSection[];
}

interface CareerSectionProps {
  section: Section;
  groupedSections: GroupedSections;
  expandedCareerSection: string | null;
  onCareerSectionToggle: (sectionId: string) => void;
  onCareerExpand: (careerId: string) => void;
  onSectionExpand: (sectionId: string) => void;
  readSections?: Set<string>;
}

// Strip HTML tags from a string (for clean title display)
const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim();

const ReadBadge = () => (
  <span className="flex items-center gap-1 text-xs text-emerald-600">
    <Check className="h-3 w-3" />
    Read
  </span>
);

const CareerSection: React.FC<CareerSectionProps> = ({
  section,
  groupedSections,
  expandedCareerSection,
  onCareerSectionToggle,
  onCareerExpand,
  onSectionExpand,
  readSections
}) => {
  // Get the title from database, fall back to static title. Strip any HTML tags.
  const getCareerTitle = (careerId: string, fallbackTitle: string): string => {
    const sections = groupedSections[careerId];
    if (sections && sections.length > 0 && sections[0].title) {
      return stripHtml(sections[0].title);
    }
    return fallbackTitle;
  };

  // Sections with careers array - show header with careers listed below (always expanded)
  if (section.careers) {
    return (
      <div>
        {/* Section header */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-semibold text-gray-900">{section.title}</h4>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>

        {/* Career list - always visible */}
        {section.careers.map((career) => (
          <div key={career.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="text-atlas-teal">•</span>
                <p className="text-sm text-gray-600">{getCareerTitle(career.id, career.title)}</p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-0.5">
                <button
                  onClick={() => onCareerExpand(career.id)}
                  className="text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline whitespace-nowrap"
                >
                  View content
                </button>
                {readSections?.has(career.id) && <ReadBadge />}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Regular sections without careers
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{section.title}</h4>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>
        <div className="ml-4 flex flex-col items-end gap-0.5">
          <button
            onClick={() => onSectionExpand(section.id)}
            className="text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline whitespace-nowrap"
          >
            View content
          </button>
          {readSections?.has(section.id) && <ReadBadge />}
        </div>
      </div>
    </div>
  );
};

export default CareerSection;
