
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Question {
  id: string;
  type: string;
  label: string;
  required: boolean;
  allow_multiple: boolean;
  allow_other: boolean;
  order_num: number;
  min_selections?: number;
  max_selections?: number;
  config: {
    choices?: string[];
    min?: number;
    max?: number;
    description?: string;
    max_length?: number;
  };
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order_num: number;
  questions: Question[];
}

export interface Survey {
  id: string;
  title: string;
  sections: Section[];
}

export const useSurvey = (surveyId: string) => {
  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async (): Promise<Survey> => {
      // Single query using Supabase's relational select (PostgREST foreign key traversal)
      // Replaces 3 sequential queries: surveys → survey_sections → questions
      const { data: survey, error } = await supabase
        .from('surveys')
        .select(`
          id, title,
          survey_sections(
            id, title, description, order_num,
            questions(
              id, type, label, required, allow_multiple, allow_other,
              order_num, min_selections, max_selections, config
            )
          )
        `)
        .eq('id', surveyId)
        .single();

      if (error) throw error;

      // Transform the nested response to match our interfaces
      const sections: Section[] = (survey.survey_sections || [])
        .sort((a: any, b: any) => (a.order_num || 0) - (b.order_num || 0))
        .map((section: any) => ({
          id: section.id,
          title: section.title || '',
          description: section.description || undefined,
          order_num: section.order_num || 0,
          questions: (section.questions || [])
            .sort((a: any, b: any) => (a.order_num || 0) - (b.order_num || 0))
            .map((q: any) => ({
              id: q.id,
              type: q.type,
              label: q.label,
              required: q.required || false,
              allow_multiple: q.allow_multiple || false,
              allow_other: q.allow_other || false,
              order_num: q.order_num || 0,
              min_selections: q.min_selections || undefined,
              max_selections: q.max_selections || undefined,
              config: typeof q.config === 'object' && q.config !== null
                ? q.config as {
                    choices?: string[];
                    min?: number;
                    max?: number;
                    description?: string;
                    max_length?: number;
                  }
                : {}
            }))
        }));

      return {
        id: survey.id,
        title: survey.title,
        sections
      };
    }
  });
};
