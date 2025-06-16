
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight } from 'lucide-react';

interface ExpandedSectionViewProps {
  expandedSection: string;
  chapters: any[];
  careerSuggestionsContent: any;
  getSectionContent: (chapterId: string, sectionId: string) => string;
  getNextSection: (chapterId: string, sectionId: string) => any;
  getNextCareer: (careerId: string) => any;
  onSectionExpand: (sectionId: string | null) => void;
}

const ExpandedSectionView: React.FC<ExpandedSectionViewProps> = ({
  expandedSection,
  chapters,
  careerSuggestionsContent,
  getSectionContent,
  getNextSection,
  getNextCareer,
  onSectionExpand
}) => {
  const renderSectionContent = (content: string) => {
    return content?.split('\n').map((paragraph, index) => {
      if (paragraph.startsWith('## ')) {
        return <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-atlas-navy">{paragraph.replace('## ', '')}</h3>;
      }
      if (paragraph.startsWith('### ')) {
        return <h4 key={index} className="text-lg font-semibold mt-6 mb-3 text-atlas-blue">{paragraph.replace('### ', '')}</h4>;
      }
      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        return <p key={index} className="font-semibold mt-4 mb-2 text-gray-900">{paragraph.replace(/\*\*/g, '')}</p>;
      }
      if (paragraph.startsWith('•')) {
        return <p key={index} className="ml-6 mb-2">{paragraph}</p>;
      }
      if (paragraph.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-3">{paragraph}</p>;
    });
  };

  const getCareerTitle = (careerId: string) => {
    const careerTitles = {
      'cso': 'Chief Strategy Officer (CSO)',
      'vp-strategic': 'VP, Strategic Initiatives',
      'business-strategist': 'Business Strategist',
      'senior-strategy-consultant': 'Senior Strategy Consultant',
      'chief-of-staff': 'Chief of Staff',
      'head-of-innovation': 'Head of Innovation',
      'director-corporate-development': 'Director of Corporate Development',
      'director-organizational-effectiveness': 'Director of Organizational Effectiveness',
      'landscape-architect': 'Landscape Architect with AI',
      'comedy-writer': 'Tech-Enabled Comedy Writer',
      'experience-designer': 'Immersive Experience Designer'
    };
    return careerTitles[careerId as keyof typeof careerTitles] || careerId;
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
        {Object.keys(careerSuggestionsContent).includes(expandedSection) && (
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
