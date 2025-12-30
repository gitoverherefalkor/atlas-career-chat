import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Briefcase } from 'lucide-react';
import { chapters } from './reportData';

interface ReportPreviewProps {
  onStartAssessment?: () => void;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ onStartAssessment }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Career Report</h2>
        <p className="text-gray-600">Complete your assessment to unlock your personalized career insights</p>
      </div>

      {/* Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chapters.map((chapter) => {
          const IconComponent = chapter.icon;

          return (
            <Card key={chapter.id} className="overflow-hidden opacity-75">
              <CardHeader className="bg-gradient-to-r from-atlas-blue to-atlas-navy text-white p-0">
                <div className="relative h-48">
                  <img
                    src={chapter.imageUrl}
                    alt={chapter.title}
                    className="w-full h-full object-cover opacity-60 grayscale"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
                    <div className="p-6 text-white">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-8 w-8" />
                        <CardTitle className="text-xl">{chapter.title}</CardTitle>
                      </div>
                    </div>
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-4 shadow-lg">
                      <Lock className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="space-y-0">
                  {chapter.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className={`p-4 border-b last:border-b-0 bg-gray-50 ${index === 0 ? '' : 'opacity-60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700">{section.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                        </div>
                        <Lock className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
                      </div>

                      {/* Show career sub-items for top-careers section */}
                      {section.careers && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                          {section.careers.map((career) => (
                            <div key={career.id} className="flex items-center text-sm text-gray-500">
                              <Lock className="h-3 w-3 mr-2" />
                              <span>{career.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      {onStartAssessment && (
        <div className="text-center pt-4">
          <button
            onClick={onStartAssessment}
            className="bg-atlas-teal hover:bg-atlas-teal/90 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all hover:shadow-xl"
          >
            Start Your Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;
