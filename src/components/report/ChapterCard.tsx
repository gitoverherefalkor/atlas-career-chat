
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CareerSection from './CareerSection';
import { ReportSection } from '@/hooks/useReportSections';

interface Career {
  id: string;
  title: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isCollapsible?: boolean;
  careers?: Career[];
}

interface Chapter {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  imageUrl: string;
  sections: Section[];
}

interface GroupedSections {
  [uiSectionId: string]: ReportSection[];
}

interface ChapterCardProps {
  chapter: Chapter;
  groupedSections: GroupedSections;
  expandedCareerSection: string | null;
  onCareerSectionToggle: (sectionId: string) => void;
  onCareerExpand: (careerId: string) => void;
  onSectionExpand: (sectionId: string) => void;
  readSections?: Set<string>;
  // When provided, replaces the default striped/circle image header.
  // The dashboard passes the matching dataviz card (Personality Radar
  // for "About You", Career Map for "Career Suggestions for You") so
  // each chapter column is led by an at-a-glance visual of its content
  // instead of decorative chrome.
  customHeader?: React.ReactNode;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  groupedSections,
  expandedCareerSection,
  onCareerSectionToggle,
  onCareerExpand,
  onSectionExpand,
  readSections,
  customHeader,
}) => {
  const IconComponent = chapter.icon;

  return (
    <Card className="overflow-hidden">
      {customHeader ? (
        // Custom header (e.g. Personality Radar / Career Map). Rendered
        // raw — the caller is responsible for styling. Solid 2px teal
        // divider below: the chart and the section list stay inside one
        // unified card, but the visual split is unmistakable.
        <div className="border-b-2 border-atlas-teal/60">
          {customHeader}
        </div>
      ) : (
        <CardHeader className="bg-gradient-to-r from-atlas-blue to-atlas-navy text-white p-0">
          <div className="relative h-48">
            <img
              src={chapter.imageUrl}
              alt={chapter.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-8 w-8" />
                  <CardTitle className="text-xl">{chapter.title}</CardTitle>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="space-y-0">
          {chapter.sections.map((section) => (
            <div key={section.id} className="border-b last:border-b-0">
              <CareerSection
                section={section}
                groupedSections={groupedSections}
                expandedCareerSection={expandedCareerSection}
                onCareerSectionToggle={onCareerSectionToggle}
                onCareerExpand={onCareerExpand}
                onSectionExpand={onSectionExpand}
                readSections={readSections}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChapterCard;
