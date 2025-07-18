
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
      // Fetch survey with sections and questions
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      const { data: sections, error: sectionsError } = await supabase
        .from('survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_num');

      if (sectionsError) throw sectionsError;

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('section_id', sections.map(s => s.id))
        .order('order_num');

      if (questionsError) throw questionsError;

      // Group questions by section and transform to match our interfaces
      const sectionsWithQuestions: Section[] = sections.map(section => ({
        id: section.id,
        title: section.title || '',
        description: section.description || undefined,
        order_num: section.order_num || 0,
        questions: questions
          .filter(q => q.section_id === section.id)
          .map(q => ({
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
        sections: sectionsWithQuestions
      };
    }
  });
};
