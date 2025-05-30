
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, FileText } from 'lucide-react';
import { useReportSections } from '@/hooks/useReportSections';

interface ReportSectionsProps {
  reportId: string;
}

const ReportSections: React.FC<ReportSectionsProps> = ({ reportId }) => {
  const { sections, isLoading, deleteSection, isDeleting } = useReportSections(reportId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No report sections generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getSectionTitle = (sectionType: string) => {
    return sectionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">
              {getSectionTitle(section.section_type)}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteSection(section.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div 
                className="whitespace-pre-wrap text-gray-700"
                dangerouslySetInnerHTML={{ 
                  __html: section.content.replace(/\n/g, '<br />') 
                }}
              />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Created: {new Date(section.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportSections;
