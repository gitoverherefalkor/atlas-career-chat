
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { JobListing } from '@/hooks/useJobSearch';

export interface SavedJob {
  id: string;
  user_id: string;
  job_search_id: string | null;
  external_job_id: string;
  job_title: string;
  company_name: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description_snippet: string | null;
  apply_url: string | null;
  source: string;
  posted_date: string | null;
  saved_at: string;
}

export const useSavedJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: savedJobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async (): Promise<SavedJob[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved jobs:', error);
        throw error;
      }

      return (data as SavedJob[]) || [];
    },
    enabled: !!user?.id,
  });

  const saveJobMutation = useMutation({
    mutationFn: async (job: JobListing) => {
      if (!user?.id) throw new Error('No user found');

      const { data, error } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: user.id,
          external_job_id: job.id,
          job_title: job.title,
          company_name: job.company || null,
          location: job.location || null,
          salary_min: job.salary_min || null,
          salary_max: job.salary_max || null,
          description_snippet: job.description?.slice(0, 500) || null,
          apply_url: job.apply_url || null,
          source: job.source || 'unknown',
          posted_date: job.posted_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', user?.id] });
      toast({ title: "Job saved", description: "Added to your saved jobs." });
    },
    onError: (error: any) => {
      // Duplicate check - unique constraint on (user_id, external_job_id)
      if (error?.code === '23505') {
        toast({ title: "Already saved", description: "This job is already in your saved list." });
        return;
      }
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unsaveJobMutation = useMutation({
    mutationFn: async (externalJobId: string) => {
      if (!user?.id) throw new Error('No user found');

      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('external_job_id', externalJobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', user?.id] });
    },
    onError: (error) => {
      console.error('Error removing saved job:', error);
      toast({
        title: "Error",
        description: "Failed to remove saved job.",
        variant: "destructive",
      });
    },
  });

  const isJobSaved = (externalJobId: string): boolean => {
    return savedJobs.some(j => j.external_job_id === externalJobId);
  };

  return {
    savedJobs,
    isLoading,
    error,
    saveJob: saveJobMutation.mutate,
    isSaving: saveJobMutation.isPending,
    unsaveJob: unsaveJobMutation.mutate,
    isUnsaving: unsaveJobMutation.isPending,
    isJobSaved,
  };
};
