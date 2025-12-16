
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { ReportSection } from '@/hooks/useReportSections';
import AILegend from './AILegend';

interface GroupedSections {
  [uiSectionId: string]: ReportSection[];
}

interface ExpandedSectionViewProps {
  expandedSection: string;
  chapters: any[];
  groupedSections: GroupedSections;
  getSectionContent: (chapterId: string, sectionId: string) => string;
  getNextSection: (chapterId: string, sectionId: string) => any;
  getPreviousSection: (chapterId: string, sectionId: string) => any;
  getNextCareer: (careerId: string) => any;
  getPreviousCareer: (careerId: string) => any;
  onSectionExpand: (sectionId: string | null) => void;
}

const ExpandedSectionView: React.FC<ExpandedSectionViewProps> = ({
  expandedSection,
  chapters,
  groupedSections,
  getSectionContent,
  getNextSection,
  getPreviousSection,
  getNextCareer,
  getPreviousCareer,
  onSectionExpand
}) => {
  // Career sections that should show AI Legend (all except dream-jobs)
  const careerSectionsWithAILegend = ['first-career', 'second-career', 'third-career', 'runner-up', 'outside-box'];

  const renderSectionContent = (content: string, showAILegend: boolean = false) => {
    const elements: React.ReactNode[] = [];
    let currentFeedback: React.ReactNode[] = [];
    let currentExplore: React.ReactNode[] = [];
    let inFeedbackBlock = false;
    let inExploreBlock = false;
    let feedbackBlockKey = 0;
    let exploreBlockKey = 0;
    let aiLegendKey = 0;
    let aiLegendShown = false;

    // Helper to flush accumulated feedback/explore blocks
    const flushBlocks = () => {
      // Show AI Legend before feedback block (only once, if applicable)
      if (showAILegend && !aiLegendShown && currentFeedback.length > 0) {
        elements.push(<AILegend key={`ai-legend-${aiLegendKey++}`} />);
        aiLegendShown = true;
      }

      if (currentFeedback.length > 0) {
        elements.push(
          <div key={`feedback-${feedbackBlockKey++}`} className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💬</span>
              <h4 className="font-semibold text-amber-800">Chat Session Feedback</h4>
            </div>
            <div className="text-amber-900">{currentFeedback}</div>
          </div>
        );
        currentFeedback = [];
      }
      if (currentExplore.length > 0) {
        elements.push(
          <div key={`explore-${exploreBlockKey++}`} className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔍</span>
              <h4 className="font-semibold text-blue-800">Explore More</h4>
            </div>
            <div className="text-blue-900">{currentExplore}</div>
          </div>
        );
        currentExplore = [];
      }
      inFeedbackBlock = false;
      inExploreBlock = false;
    };

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

      // Section separator - flush current blocks and reset
      if (paragraph.trim() === '---') {
        flushBlocks();
        return;
      }

      // Common subheader patterns (should render as h5)
      const subheaderPatterns = [
        'Overview:',
        'Overview',
        'Feasibility Rating',
        'Feasibility Rating:',
        'Personality Fit',
        'Personality Fit:',
        'Steps for Pursuing This Role',
        'Steps for Pursuing This Role:',
        'Key Considerations',
        'Key Considerations:',
        'Compensation',
        'Compensation:',
        'Pros & Cons',
        'Pros & Cons:',
        'Pros',
        'Cons',
        'What you would do',
        'Why this fits',
        'Potential for growth',
        'Alignment with your ambitions',
        'Future Outlook',
      ];

      // Check if line is a subheader (starts with pattern, possibly with colon)
      const isSubheader = subheaderPatterns.some(pattern =>
        paragraph.trim() === pattern ||
        paragraph.trim() === `${pattern}:` ||
        paragraph.trim().toLowerCase() === pattern.toLowerCase() ||
        paragraph.trim().toLowerCase() === `${pattern.toLowerCase()}:`
      );

      // Parse the paragraph
      let element: React.ReactNode;
      if (paragraph.startsWith('## ')) {
        // New section header - flush blocks first
        flushBlocks();
        const title = paragraph.replace('## ', '');
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        element = <h3 key={index} id={id} className="text-xl font-bold mt-10 mb-4 text-atlas-navy first:mt-0 scroll-mt-24">{title}</h3>;
      } else if (paragraph.startsWith('### ')) {
        element = <h4 key={index} className="text-lg font-semibold mt-6 mb-3 text-atlas-blue">{paragraph.replace('### ', '')}</h4>;
      } else if (isSubheader) {
        // h5 subheader styling
        element = <h5 key={index} className="text-base font-semibold mt-6 mb-2 text-gray-800">{paragraph.trim()}</h5>;
      } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        element = <p key={index} className="font-semibold mt-4 mb-2 text-gray-900">{paragraph.replace(/\*\*/g, '')}</p>;
      } else if (paragraph.startsWith('•') || paragraph.startsWith('- ')) {
        const text = paragraph.startsWith('- ') ? paragraph.substring(2) : paragraph.substring(1);
        element = <p key={index} className="ml-6 mb-2 before:content-['•'] before:mr-2">{text.trim()}</p>;
      } else if (paragraph.trim() === '') {
        element = <br key={index} />;
      } else {
        element = <p key={index} className="mb-3">{paragraph}</p>;
      }

      if (element) {
        if (inFeedbackBlock) {
          currentFeedback.push(element);
        } else if (inExploreBlock) {
          currentExplore.push(element);
        } else {
          elements.push(element);
        }
      }
    });

    // Flush any remaining blocks at the end
    flushBlocks();

    return elements;
  };

  // Multi-item sections that should use generic titles in header
  const multiItemSections = ['runner-up', 'outside-box', 'dream-jobs'];

  const getCareerTitle = (careerId: string) => {
    // Section-level titles for display in header
    const sectionTitles: Record<string, string> = {
      'first-career': 'Primary Career Match',
      'second-career': 'Second Career Match',
      'third-career': 'Third Career Match',
      'runner-up': 'Runner-up Careers',
      'outside-box': 'Outside-the-Box Careers',
      'dream-jobs': 'Dream Job Analysis'
    };

    // For multi-item sections, always use the generic section title
    if (multiItemSections.includes(careerId)) {
      return sectionTitles[careerId] || careerId;
    }

    // For single-item sections, try to get title from database
    const sections = groupedSections[careerId];
    if (sections && sections.length > 0 && sections[0].title) {
      return sections[0].title;
    }

    return sectionTitles[careerId] || careerId;
  };

  const getSectionDescription = (careerId: string) => {
    const descriptions: Record<string, string> = {
      'first-career': 'Your top career match based on your profile',
      'second-career': 'A strong alternative career path for you',
      'third-career': 'Another well-suited career option',
      'runner-up': 'Additional career options worth considering',
      'outside-box': 'Creative career paths based on your unique interests',
      'dream-jobs': 'Feasibility analysis of your dream career aspirations'
    };
    return descriptions[careerId] || 'Detailed career analysis and recommendations';
  };

  // Career section IDs that should use the career view, not the chapter section view
  const careerSectionIds = ['first-career', 'second-career', 'third-career', 'runner-up', 'outside-box', 'dream-jobs'];

  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        {chapters.map(chapter =>
          chapter.sections.map((section: any) => {
            // Skip if not the expanded section
            if (section.id !== expandedSection) return null;

            // Skip if this is a career section - it will be rendered by the career view below
            if (careerSectionIds.includes(section.id)) return null;

            const nextSection = getNextSection(chapter.id, section.id);
            const previousSection = getPreviousSection(chapter.id, section.id);

            return (
              <div key={section.id}>
                {/* Close button - top right */}
                <div className="flex justify-end p-4 border-b border-gray-100">
                  <button
                    onClick={() => onSectionExpand(null)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 md:p-8 lg:p-10">
                  <div className="max-w-prose mx-auto">
                    {/* Title and description above content */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-atlas-navy mb-2">{section.title}</h2>
                      <p className="text-gray-600">{section.description}</p>
                    </div>

                    <div
                      className="text-gray-700 leading-relaxed"
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.8'
                      }}
                    >
                      {renderSectionContent(getSectionContent(chapter.id, section.id))}
                    </div>

                    {(previousSection || nextSection) && (
                      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        <div>
                          {previousSection && (
                            <button
                              onClick={() => onSectionExpand(previousSection.section.id)}
                              className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Previous: {previousSection.section.title}
                            </button>
                          )}
                        </div>
                        <div>
                          {nextSection && (
                            <button
                              onClick={() => onSectionExpand(nextSection.section.id)}
                              className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                            >
                              Next: {nextSection.section.title}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Individual Career Expanded View */}
        {/* Check if this is a career section */}
        {careerSectionIds.includes(expandedSection) && (
          <div>
            {/* Close button - top right */}
            <div className="flex justify-end p-4 border-b border-gray-100">
              <button
                onClick={() => onSectionExpand(null)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 md:p-8 lg:p-10">
              <div className="max-w-prose mx-auto">
                {/* Navigation menu for multi-item sections */}
                {multiItemSections.includes(expandedSection) && groupedSections[expandedSection] && groupedSections[expandedSection].length > 1 && (
                  <nav className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Jump to:</h4>
                    <div className="flex flex-wrap gap-2">
                      {groupedSections[expandedSection].map((section, idx) => {
                        const title = section.title || `Item ${idx + 1}`;
                        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return (
                          <button
                            key={section.id}
                            onClick={() => {
                              const element = document.getElementById(id);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-atlas-teal hover:text-white hover:border-atlas-teal transition-colors"
                          >
                            {title}
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                )}

                <div
                  className="text-gray-700 leading-relaxed"
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.8'
                  }}
                >
                  {renderSectionContent(getSectionContent('career-suggestions', expandedSection), careerSectionsWithAILegend.includes(expandedSection))}
                </div>

                {(() => {
                  const nextCareer = getNextCareer(expandedSection);
                  const previousCareer = getPreviousCareer(expandedSection);
                  return (previousCareer || nextCareer) && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                      <div>
                        {previousCareer && (
                          <button
                            onClick={() => onSectionExpand(previousCareer.id)}
                            className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous: {previousCareer.title}
                          </button>
                        )}
                      </div>
                      <div>
                        {nextCareer && (
                          <button
                            onClick={() => onSectionExpand(nextCareer.id)}
                            className="flex items-center text-atlas-blue hover:text-atlas-navy transition-colors font-medium"
                          >
                            Next: {nextCareer.title}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpandedSectionView;
