
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReportSection {
  id: string;
  report_id: string;
  section_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useReportSections = (reportId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: sections = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['report-sections', reportId],
    queryFn: async (): Promise<ReportSection[]> => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('report_sections')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching report sections:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!reportId,
  });

  const createSectionMutation = useMutation({
    mutationFn: async (section: {
      report_id: string;
      section_type: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('report_sections')
        .insert(section)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-sections', reportId] });
    },
    onError: (error) => {
      console.error('Error creating report section:', error);
      toast({
        title: "Error",
        description: "Failed to create report section. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from('report_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-sections', reportId] });
      toast({
        title: "Section deleted",
        description: "The report section has been removed.",
      });
    },
    onError: (error) => {
      console.error('Error deleting report section:', error);
      toast({
        title: "Error",
        description: "Failed to delete report section. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    sections,
    isLoading,
    error,
    createSection: createSectionMutation.mutate,
    isCreating: createSectionMutation.isPending,
    deleteSection: deleteSectionMutation.mutate,
    isDeleting: deleteSectionMutation.isPending,
  };
};
