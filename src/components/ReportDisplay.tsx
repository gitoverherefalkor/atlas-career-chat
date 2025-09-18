
import React, { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { useReportSections } from '@/hooks/useReportSections';
import ReportHeader from './report/ReportHeader';
import ChapterCard from './report/ChapterCard';
import ExpandedSectionView from './report/ExpandedSectionView';
import { aboutYouContent, careerSuggestionsContent, chapters } from './report/reportData';

interface ReportDisplayProps {
  userEmail?: string;
  onSectionExpanded?: (expanded: boolean) => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ userEmail, onSectionExpanded }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCareerSection, setExpandedCareerSection] = useState<string | null>(null);
  const { reports } = useReports();

  // Always show when there are reports available

  const getLatestReport = () => {
    if (!reports || reports.length === 0) return null;
    return reports[0]; // Reports are ordered by created_at desc
  };

  const latestReport = getLatestReport();
  const { sections: dbSections } = useReportSections(latestReport?.id);

  // Create a map of database sections by chapter_id and section_id
  const dbSectionMap = React.useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    dbSections.forEach(section => {
      if (section.chapter_id && section.section_id) {
        if (!map[section.chapter_id]) {
          map[section.chapter_id] = {};
        }
        map[section.chapter_id][section.section_id] = section.content;
      }
    });
    return map;
  }, [dbSections]);

  const getAllCareerIds = () => {
    const careerIds: string[] = [];
    chapters.forEach(chapter => {
      chapter.sections.forEach(section => {
        if (section.careers) {
          section.careers.forEach(career => {
            careerIds.push(career.id);
          });
        }
      });
    });
    return careerIds;
  };

  const getNextCareer = (currentCareerId: string) => {
    const allCareerIds = getAllCareerIds();
    const currentIndex = allCareerIds.indexOf(currentCareerId);
    
    if (currentIndex < allCareerIds.length - 1) {
      const nextCareerId = allCareerIds[currentIndex + 1];
      
      // Find the career title
      for (const chapter of chapters) {
        for (const section of chapter.sections) {
          if (section.careers) {
            const career = section.careers.find(c => c.id === nextCareerId);
            if (career) {
              return { id: nextCareerId, title: career.title };
            }
          }
        }
      }
    }
    
    // If no next career, go to dream jobs
    if (currentIndex === allCareerIds.length - 1) {
      return { id: 'dream-jobs', title: 'Dream Job Analysis' };
    }
    
    return null;
  };

  const getSectionContent = (chapterId: string, sectionId: string) => {
    // First try to get content from database
    const dbContent = dbSectionMap[chapterId]?.[sectionId];
    if (dbContent) {
      return dbContent;
    }

    // Fall back to hardcoded content if no database content exists
    if (chapterId === 'about-you') {
      switch (sectionId) {
        case 'executive-summary':
          return aboutYouContent.split('## PERSONALITY AND TEAM DYNAMICS')[0];
        case 'personality-team':
          return aboutYouContent.split('## PERSONALITY AND TEAM DYNAMICS')[1]?.split('## YOUR STRENGTHS')[0];
        case 'strengths':
          return aboutYouContent.split('## YOUR STRENGTHS')[1]?.split('## OPPORTUNITIES FOR GROWTH')[0];
        case 'growth':
          return aboutYouContent.split('## OPPORTUNITIES FOR GROWTH')[1]?.split('## YOUR (CAREER) VALUES')[0];
        case 'values':
          return aboutYouContent.split('## YOUR (CAREER) VALUES')[1];
        default:
          return aboutYouContent;
      }
    } else if (chapterId === 'career-suggestions') {
      // Map database section IDs to hardcoded content keys
      const sectionMap: Record<string, string> = {
        'first-career': 'cso',
        'second-career': 'vp-strategic',
        'third-career': 'business-strategist',
        'runner-up': 'senior-strategy-consultant',
        'outside-box': 'landscape-architect',
        'dream-jobs': 'dream-jobs'
      };
      
      const contentKey = sectionMap[sectionId] || sectionId;
      return careerSuggestionsContent[contentKey as keyof typeof careerSuggestionsContent] || '';
    }
    
    return '';
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
          careerSuggestionsContent={careerSuggestionsContent}
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
