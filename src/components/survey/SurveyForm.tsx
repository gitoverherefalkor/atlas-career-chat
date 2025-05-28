
import React, { useState } from 'react';
import { useSurvey } from '@/hooks/useSurvey';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SurveyFormProps {
  surveyId: string;
  onComplete: (responses: Record<string, any>) => void;
  accessCodeData?: any;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ 
  surveyId, 
  onComplete, 
  accessCodeData 
}) => {
  const { data: survey, isLoading, error } = useSurvey(surveyId);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load survey. Please try again.</p>
      </div>
    );
  }

  const currentSection = survey.sections[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];
  
  // Calculate total questions across all sections for progress
  const totalQuestions = survey.sections.reduce((total, section) => total + section.questions.length, 0);
  const currentQuestionNumber = survey.sections.slice(0, currentSectionIndex).reduce((total, section) => total + section.questions.length, 0) + currentQuestionIndex + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isCurrentQuestionComplete = () => {
    if (!currentQuestion.required) return true;
    const response = responses[currentQuestion.id];
    return response !== undefined && response !== null && response !== '';
  };

  const handleNext = () => {
    // Move to next question in current section
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } 
    // Move to first question of next section
    else if (currentSectionIndex < survey.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handleBack = () => {
    // Move to previous question in current section
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    // Move to last question of previous section
    else if (currentSectionIndex > 0) {
      const prevSection = survey.sections[currentSectionIndex - 1];
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
  };

  const isLastQuestion = () => {
    return currentSectionIndex === survey.sections.length - 1 && 
           currentQuestionIndex === currentSection.questions.length - 1;
  };

  const isFirstQuestion = () => {
    return currentSectionIndex === 0 && currentQuestionIndex === 0;
  };

  const markAccessCodeAsUsed = async () => {
    if (!accessCodeData?.id) return;

    try {
      console.log('Marking access code as used:', accessCodeData.id);
      
      // First get the current usage count
      const { data: currentCode, error: fetchError } = await supabase
        .from('access_codes')
        .select('usage_count')
        .eq('id', accessCodeData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current usage count:', fetchError);
        return;
      }

      // Increment the usage count
      const newUsageCount = (currentCode.usage_count || 0) + 1;
      
      const { error } = await supabase
        .from('access_codes')
        .update({ 
          usage_count: newUsageCount,
          used_at: new Date().toISOString()
        })
        .eq('id', accessCodeData.id);

      if (error) {
        console.error('Error marking access code as used:', error);
      } else {
        console.log('Access code marked as used successfully');
      }
    } catch (error) {
      console.error('Error marking access code as used:', error);
    }
  };

  const handleSubmit = async () => {
    if (!isCurrentQuestionComplete()) {
      toast({
        title: "Incomplete Question",
        description: "Please answer this question before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting survey responses:', responses);
      console.log('Access code data:', accessCodeData);

      // Submit to database with access code reference
      const { data: submissionData, error: submissionError } = await supabase
        .from('answers')
        .insert({
          survey_id: surveyId,
          payload: responses,
          access_code_id: accessCodeData?.id
        })
        .select();

      if (submissionError) {
        console.error('Error submitting survey:', submissionError);
        toast({
          title: "Submission Failed",
          description: "Failed to submit your responses. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Survey submitted successfully:', submissionData);

      // Mark access code as used after successful submission
      await markAccessCodeAsUsed();

      toast({
        title: "Survey Submitted",
        description: "Your responses have been submitted successfully!",
      });

      // Call completion handler
      onComplete(responses);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with access code info */}
      {accessCodeData && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Access Code Verified: {accessCodeData.code}
                </p>
                <p className="text-xs text-green-600">
                  Survey: {accessCodeData.survey_type}
                </p>
              </div>
              <div className="text-xs text-green-600">
                Remaining uses: {accessCodeData.remaining_uses}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <span className="text-sm text-gray-500">
            Question {currentQuestionNumber} of {totalQuestions}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle>{currentSection.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <QuestionRenderer
            key={currentQuestion.id}
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstQuestion()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {!isLastQuestion() ? (
              <Button
                onClick={handleNext}
                disabled={!isCurrentQuestionComplete()}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isCurrentQuestionComplete() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Assessment
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
