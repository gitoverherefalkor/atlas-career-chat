
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

interface CareerSectionProps {
  section: Section;
  expandedCareerSection: string | null;
  onCareerSectionToggle: (sectionId: string) => void;
  onCareerExpand: (careerId: string) => void;
  onSectionExpand: (sectionId: string) => void;
}

const CareerSection: React.FC<CareerSectionProps> = ({
  section,
  expandedCareerSection,
  onCareerSectionToggle,
  onCareerExpand,
  onSectionExpand
}) => {
  if (section.isCollapsible) {
    return (
      <div>
        <div 
          className="p-4 hover:bg-gray-50 cursor-pointer"
          onClick={() => onCareerSectionToggle(section.id)}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {expandedCareerSection === section.id ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <h4 className="font-semibold text-gray-900">{section.title}</h4>
              </div>
              <p className="text-sm text-gray-600 ml-6">{section.description}</p>
            </div>
          </div>
        </div>
        
        {/* Expanded career list */}
        {expandedCareerSection === section.id && section.careers && (
          <div className="bg-gray-50 border-t">
            {section.careers.map((career) => (
              <div key={career.id} className="px-8 py-3 border-b last:border-b-0 hover:bg-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{career.title}</span>
                  <button
                    onClick={() => onCareerExpand(career.id)}
                    className="text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline"
                  >
                    View content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{section.title}</h4>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>
        <button
          onClick={() => onSectionExpand(section.id)}
          className="ml-4 text-atlas-blue hover:text-atlas-navy text-sm font-medium hover:underline"
        >
          View content
        </button>
      </div>
    </div>
  );
};

export default CareerSection;
