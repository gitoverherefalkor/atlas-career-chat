
import React from 'react';
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
}

const CareerSection: React.FC<CareerSectionProps> = ({
  section,
  groupedSections,
  expandedCareerSection,
  onCareerSectionToggle,
  onCareerExpand,
  onSectionExpand
}) => {
  // Get the title from database, fall back to static title
  const getCareerTitle = (careerId: string, fallbackTitle: string): string => {
    const sections = groupedSections[careerId];
    if (sections && sections.length > 0 && sections[0].title) {
      return sections[0].title;
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
          <div key={career.id} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{getCareerTitle(career.id, career.title)}</h4>
              </div>
              <button
                onClick={() => onCareerExpand(career.id)}
                className="ml-4 text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline whitespace-nowrap"
              >
                View content
              </button>
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
        <button
          onClick={() => onSectionExpand(section.id)}
          className="ml-4 text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline whitespace-nowrap"
        >
          View content
        </button>
      </div>
    </div>
  );
};

export default CareerSection;
