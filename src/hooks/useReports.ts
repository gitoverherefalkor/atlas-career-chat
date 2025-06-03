
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: string;
  user_id: string;
  access_code_id: string | null;
  survey_id: string | null;
  title: string;
  status: string;
  payload: any;
  created_at: string;
  updated_at: string;
}

export const useReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['reports', user?.id],
    queryFn: async (): Promise<Report[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  const createReportMutation = useMutation({
    mutationFn: async (report: {
      title: string;
      payload: any;
      access_code_id?: string;
      survey_id?: string;
    }) => {
      if (!user?.id) throw new Error('No user found');

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: report.title,
          payload: report.payload,
          access_code_id: report.access_code_id || null,
          survey_id: report.survey_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      toast({
        title: "Report saved",
        description: "Your assessment report has been saved.",
      });
    },
    onError: (error) => {
      console.error('Error creating report:', error);
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      // First delete all report sections
      const { error: sectionsError } = await supabase
        .from('report_sections')
        .delete()
        .eq('report_id', reportId);

      if (sectionsError) throw sectionsError;

      // Then delete the report
      const { error: reportError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user?.id);

      if (reportError) throw reportError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      toast({
        title: "Report deleted",
        description: "The report has been permanently deleted.",
      });
    },
    onError: (error) => {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    reports,
    isLoading,
    error,
    createReport: createReportMutation.mutate,
    isCreating: createReportMutation.isPending,
    deleteReport: deleteReportMutation.mutate,
    isDeleting: deleteReportMutation.isPending,
  };
};
