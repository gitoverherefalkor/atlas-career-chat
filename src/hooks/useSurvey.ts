
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
  config: {
    choices?: string[];
    min?: number;
    max?: number;
  };
}

export interface Section {
  id: string;
  title: string;
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
        .from('sections')
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

      // Group questions by section
      const sectionsWithQuestions = sections.map(section => ({
        ...section,
        questions: questions.filter(q => q.section_id === section.id)
      }));

      return {
        ...survey,
        sections: sectionsWithQuestions
      };
    }
  });
};
