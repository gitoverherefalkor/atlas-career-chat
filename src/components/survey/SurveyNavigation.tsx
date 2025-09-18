import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, Lock } from 'lucide-react';

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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'accessible':
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Lock className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <Card className="w-80 h-fit">
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
      </CardContent>
    </Card>
  );
};