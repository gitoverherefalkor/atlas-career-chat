
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight } from 'lucide-react';
import { ReportSection } from '@/hooks/useReportSections';

interface GroupedSections {
  [uiSectionId: string]: ReportSection[];
}

interface ExpandedSectionViewProps {
  expandedSection: string;
  chapters: any[];
  groupedSections: GroupedSections;
  getSectionContent: (chapterId: string, sectionId: string) => string;
  getNextSection: (chapterId: string, sectionId: string) => any;
  getNextCareer: (careerId: string) => any;
  onSectionExpand: (sectionId: string | null) => void;
}

const ExpandedSectionView: React.FC<ExpandedSectionViewProps> = ({
  expandedSection,
  chapters,
  groupedSections,
  getSectionContent,
  getNextSection,
  getNextCareer,
  onSectionExpand
}) => {
  const renderSectionContent = (content: string) => {
    // Track if we're in a feedback or explore block
    let inFeedbackBlock = false;
    let inExploreBlock = false;
    const elements: React.ReactNode[] = [];
    let feedbackContent: React.ReactNode[] = [];
    let exploreContent: React.ReactNode[] = [];

    content?.split('\n').forEach((paragraph, index) => {
      // Check for feedback section marker
      if (paragraph.includes('💬 Chat Session Feedback')) {
        inFeedbackBlock = true;
        inExploreBlock = false;
        return;
      }
      // Check for explore section marker
      if (paragraph.includes('🔍 Explore More')) {
        inFeedbackBlock = false;
        inExploreBlock = true;
        return;
      }

      // Parse the paragraph
      let element: React.ReactNode;
      if (paragraph.startsWith('## ')) {
        element = <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-atlas-navy">{paragraph.replace('## ', '')}</h3>;
      } else if (paragraph.startsWith('### ')) {
        element = <h4 key={index} className="text-lg font-semibold mt-6 mb-3 text-atlas-blue">{paragraph.replace('### ', '')}</h4>;
      } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        element = <p key={index} className="font-semibold mt-4 mb-2 text-gray-900">{paragraph.replace(/\*\*/g, '')}</p>;
      } else if (paragraph.startsWith('•')) {
        element = <p key={index} className="ml-6 mb-2">{paragraph}</p>;
      } else if (paragraph.trim() === '' || paragraph.trim() === '---') {
        element = paragraph.trim() === '---' ? null : <br key={index} />;
      } else {
        element = <p key={index} className="mb-3">{paragraph}</p>;
      }

      if (element) {
        if (inFeedbackBlock) {
          feedbackContent.push(element);
        } else if (inExploreBlock) {
          exploreContent.push(element);
        } else {
          elements.push(element);
        }
      }
    });

    // Add feedback block if present
    if (feedbackContent.length > 0) {
      elements.push(
        <div key="feedback-block" className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💬</span>
            <h4 className="font-semibold text-amber-800">Chat Session Feedback</h4>
          </div>
          <div className="text-amber-900">{feedbackContent}</div>
        </div>
      );
    }

    // Add explore block if present
    if (exploreContent.length > 0) {
      elements.push(
        <div key="explore-block" className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔍</span>
            <h4 className="font-semibold text-blue-800">Explore More</h4>
          </div>
          <div className="text-blue-900">{exploreContent}</div>
        </div>
      );
    }

    return elements;
  };

  const getCareerTitle = (careerId: string) => {
    // First try to get title from database
    const sections = groupedSections[careerId];
    if (sections && sections.length > 0 && sections[0].title) {
      return sections[0].title;
    }
    // Fallback titles for new section IDs
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

  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        {chapters.map(chapter => 
          chapter.sections.map((section: any) => {
            if (section.id !== expandedSection) return null;
            
            const nextSection = getNextSection(chapter.id, section.id);
            
            return (
              <div key={section.id}>
                <div className="relative h-64 bg-gradient-to-r from-atlas-blue to-atlas-navy">
                  <img
                    src={section.imageUrl}
                    alt={section.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                    <div className="p-6 text-white w-full">
                      <h3 className="text-2xl font-bold mb-2">{section.title}</h3>
                      <p className="text-lg opacity-90">{section.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSectionExpand(null)}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="prose prose-lg max-w-none">
                    <div 
                      className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                      style={{ 
                        fontSize: '16px',
                        lineHeight: '1.7'
                      }}
                    >
                      {renderSectionContent(getSectionContent(chapter.id, section.id))}
                    </div>
                  </div>
                  
                  {nextSection && (
                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => onSectionExpand(nextSection.section.id)}
                        className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                      >
                        Next: {nextSection.section.title}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {/* Individual Career Expanded View */}
        {/* Check if this is a career section by looking for it in groupedSections */}
        {(groupedSections[expandedSection] ||
          ['first-career', 'second-career', 'third-career', 'runner-up', 'outside-box', 'dream-jobs'].includes(expandedSection)) && (
          <div>
            <div className="relative h-64 bg-gradient-to-r from-atlas-blue to-atlas-navy">
              <img
                src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop"
                alt="Career"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                <div className="p-6 text-white w-full">
                  <h3 className="text-2xl font-bold mb-2">
                    {getCareerTitle(expandedSection)}
                  </h3>
                  <p className="text-lg opacity-90">Detailed career analysis and recommendations</p>
                </div>
              </div>
              <button
                onClick={() => onSectionExpand(null)}
                className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="prose prose-lg max-w-none">
                <div 
                  className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '1.7'
                  }}
                >
                  {renderSectionContent(getSectionContent('career-suggestions', expandedSection))}
                </div>
              </div>
              
              {(() => {
                const nextCareer = getNextCareer(expandedSection);
                return nextCareer && (
                  <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => onSectionExpand(nextCareer.id)}
                      className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                    >
                      Next: {nextCareer.title}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpandedSectionView;
