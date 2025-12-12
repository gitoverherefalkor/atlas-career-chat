
import React, { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { useReportSections, ReportSection, SECTION_TYPE_MAP } from '@/hooks/useReportSections';
import ReportHeader from './report/ReportHeader';
import ChapterCard from './report/ChapterCard';
import ExpandedSectionView from './report/ExpandedSectionView';
import { chapters } from './report/reportData';

interface ReportDisplayProps {
  userEmail?: string;
  onSectionExpanded?: (expanded: boolean) => void;
}

// Group sections by their UI section ID
interface GroupedSections {
  [uiSectionId: string]: ReportSection[];
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ userEmail, onSectionExpanded }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCareerSection, setExpandedCareerSection] = useState<string | null>(null);
  const { reports } = useReports();

  const getLatestReport = () => {
    if (!reports || reports.length === 0) return null;
    return reports[0]; // Reports are ordered by created_at desc
  };

  const latestReport = getLatestReport();
  const { sections: dbSections } = useReportSections(latestReport?.id);

  // Group database sections by UI section ID
  const groupedSections = React.useMemo((): GroupedSections => {
    const grouped: GroupedSections = {};
    dbSections.forEach(section => {
      const uiSectionId = SECTION_TYPE_MAP[section.section_type];
      if (uiSectionId) {
        if (!grouped[uiSectionId]) {
          grouped[uiSectionId] = [];
        }
        grouped[uiSectionId].push(section);
      }
    });
    // Sort each group by order_number
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
    });
    return grouped;
  }, [dbSections]);

  // Get the title for a career section from the database
  const getCareerTitle = (careerId: string): string => {
    const sections = groupedSections[careerId];
    if (sections && sections.length > 0 && sections[0].title) {
      return sections[0].title;
    }
    // Fallback titles
    const fallbackTitles: Record<string, string> = {
      'first-career': 'Primary Career Match',
      'second-career': 'Second Career Match',
      'third-career': 'Third Career Match',
      'runner-up': 'Runner-up Careers',
      'outside-box': 'Outside-the-Box Careers',
      'dream-jobs': 'Dream Job Analysis'
    };
    return fallbackTitles[careerId] || careerId;
  };

  const getAllCareerIds = () => {
    // Top 3 careers followed by multi-item sections
    return ['first-career', 'second-career', 'third-career', 'runner-up', 'outside-box', 'dream-jobs'];
  };

  const getNextCareer = (currentCareerId: string) => {
    const allCareerIds = getAllCareerIds();
    const currentIndex = allCareerIds.indexOf(currentCareerId);

    if (currentIndex >= 0 && currentIndex < allCareerIds.length - 1) {
      const nextCareerId = allCareerIds[currentIndex + 1];
      return { id: nextCareerId, title: getCareerTitle(nextCareerId) };
    }

    return null;
  };

  // Build content string from grouped sections, including feedback/explore
  const getSectionContent = (chapterId: string, sectionId: string): string => {
    const sections = groupedSections[sectionId];

    if (!sections || sections.length === 0) {
      return '';
    }

    // For single-item sections (about-you sections, top careers)
    if (sections.length === 1) {
      const section = sections[0];
      let content = section.content || '';

      // Add feedback if present
      if (section.feedback) {
        content += `\n\n---\n\n**💬 Chat Session Feedback**\n\n${section.feedback}`;
      }

      // Add explore content if present
      if (section.explore) {
        content += `\n\n---\n\n**🔍 Explore More**\n\n${section.explore}`;
      }

      return content;
    }

    // For multi-item sections (runner-up, outside-box, dream-jobs)
    // Combine all entries with their titles
    let combinedContent = '';
    sections.forEach((section, index) => {
      if (index > 0) {
        combinedContent += '\n\n---\n\n';
      }

      // Use title if available, otherwise derive from content
      if (section.title) {
        combinedContent += `## ${section.title}\n\n`;
      }

      combinedContent += section.content || '';

      // Add feedback if present
      if (section.feedback) {
        combinedContent += `\n\n**💬 Chat Session Feedback**\n\n${section.feedback}`;
      }

      // Add explore content if present
      if (section.explore) {
        combinedContent += `\n\n**🔍 Explore More**\n\n${section.explore}`;
      }
    });

    return combinedContent;
  };

  const getNextSection = (currentChapterId: string, currentSectionId: string) => {
    const currentChapter = chapters.find(c => c.id === currentChapterId);
    if (!currentChapter) return null;

    const currentSectionIndex = currentChapter.sections.findIndex(s => s.id === currentSectionId);
    
    // If there's a next section in the same chapter
    if (currentSectionIndex < currentChapter.sections.length - 1) {
      return {
        chapterId: currentChapterId,
        section: currentChapter.sections[currentSectionIndex + 1]
      };
    }
    
    // If we're at the end of the first chapter, go to the first section of the next chapter
    if (currentChapterId === 'about-you') {
      const nextChapter = chapters.find(c => c.id === 'career-suggestions');
      if (nextChapter) {
        return {
          chapterId: 'career-suggestions',
          section: nextChapter.sections[0]
        };
      }
    }
    
    return null;
  };

  const handleSectionExpand = (sectionId: string | null) => {
    setExpandedSection(sectionId);
    setExpandedCareerSection(null); // Reset career section when main section changes
    onSectionExpanded?.(sectionId !== null);
  };

  const handleCareerSectionToggle = (sectionId: string) => {
    setExpandedCareerSection(expandedCareerSection === sectionId ? null : sectionId);
  };

  const handleCareerExpand = (careerId: string) => {
    setExpandedSection(careerId);
    setExpandedCareerSection(null);
    onSectionExpanded?.(true);
  };

  return (
    <div className="space-y-6">
      <ReportHeader latestReport={latestReport} />

      {/* Expanded Section View */}
      {expandedSection && (
        <ExpandedSectionView
          expandedSection={expandedSection}
          chapters={chapters}
          groupedSections={groupedSections}
          getSectionContent={getSectionContent}
          getNextSection={getNextSection}
          getNextCareer={getNextCareer}
          onSectionExpand={handleSectionExpand}
        />
      )}

      {/* Chapter Columns */}
      {!expandedSection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              groupedSections={groupedSections}
              expandedCareerSection={expandedCareerSection}
              onCareerSectionToggle={handleCareerSectionToggle}
              onCareerExpand={handleCareerExpand}
              onSectionExpand={handleSectionExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;
