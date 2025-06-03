
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, FileText } from 'lucide-react';
import { useReportSections } from '@/hooks/useReportSections';
import { useReports } from '@/hooks/useReports';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ReportSectionsProps {
  reportId: string;
  onReportDeleted?: (deletedDate: string) => void;
}

const ReportSections: React.FC<ReportSectionsProps> = ({ reportId, onReportDeleted }) => {
  const { sections, isLoading, deleteSection, isDeleting } = useReportSections(reportId);
  const { deleteReport, isDeleting: isDeletingReport } = useReports();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteReport = () => {
    if (deleteConfirmText === 'delete') {
      deleteReport(reportId, {
        onSuccess: () => {
          const deletedDate = new Date().toLocaleDateString();
          onReportDeleted?.(deletedDate);
          setShowDeleteDialog(false);
          setDeleteConfirmText('');
        }
      });
    }
  };

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
      {/* Delete Report Button */}
      <div className="flex justify-end border-b pb-4">
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entire Report
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entire Report</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>This will permanently delete the entire report and all its sections. This action cannot be undone.</p>
                <p>To confirm, please type <strong>"delete"</strong> below:</p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="mt-2"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReport}
                disabled={deleteConfirmText !== 'delete' || isDeletingReport}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeletingReport ? 'Deleting...' : 'Delete Report'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">
              {getSectionTitle(section.section_type)}
            </CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Section</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this report section. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSection(section.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Section
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
