
import React, { useState, useReducer } from 'react';
import { useSurvey, Survey, Section, Question } from '@/hooks/useSurvey';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SurveyFormProps {
  surveyId: string;
  onComplete?: (responses: Record<string, any>) => void;
}

type SurveyState = Record<string, any>;

interface SurveyAction {
  type: 'SET_ANSWER';
  questionId: string;
  value: any;
}

const surveyReducer = (state: SurveyState, action: SurveyAction): SurveyState => {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        [action.questionId]: action.value
      };
    default:
      return state;
  }
};

export const SurveyForm: React.FC<SurveyFormProps> = ({ surveyId, onComplete }) => {
  const { data: survey, isLoading, error } = useSurvey(surveyId);
  const [responses, dispatch] = useReducer(surveyReducer, {});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
          <p className="text-gray-600">The requested survey could not be loaded.</p>
        </div>
      </div>
    );
  }

  const currentSection = survey.sections[currentSectionIndex];
  const totalQuestions = survey.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const validateSection = (section: Section): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    section.questions.forEach(question => {
      if (question.required) {
        const value = responses[question.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors[question.id] = 'This field is required';
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSectionIndex(prev => Math.min(prev + 1, survey.sections.length - 1));
      setValidationErrors({});
    }
  };

  const handlePrevious = () => {
    setCurrentSectionIndex(prev => Math.max(prev - 1, 0));
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    if (!validateSection(currentSection)) {
      return;
    }

    // Validate all required questions across all sections
    let allValid = true;
    const allErrors: Record<string, string> = {};

    survey.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.required) {
          const value = responses[question.id];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            allErrors[question.id] = 'This field is required';
            allValid = false;
          }
        }
      });
    });

    if (!allValid) {
      setValidationErrors(allErrors);
      toast({
        title: "Incomplete Survey",
        description: "Please complete all required questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('answers')
        .insert({
          survey_id: surveyId,
          payload: responses
        });

      if (error) throw error;

      toast({
        title: "Survey Submitted",
        description: "Thank you for completing the assessment!",
      });

      onComplete?.(responses);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastSection = currentSectionIndex === survey.sections.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Section {currentSectionIndex + 1} of {survey.sections.length}</span>
            <span>{answeredQuestions} of {totalQuestions} questions answered</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentSection.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {currentSection.questions.map((question) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              value={responses[question.id]}
              onChange={(value) => dispatch({ type: 'SET_ANSWER', questionId: question.id, value })}
              error={validationErrors[question.id]}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSectionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {isLastSection ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Survey
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
