import React, { useState } from 'react';
import { useSurvey } from '@/hooks/useSurvey';
import { QuestionRenderer } from './QuestionRenderer';
import { SectionIntroduction } from './SectionIntroduction';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SurveyFormProps {
  surveyId: string;
  onComplete: (responses: Record<string, any>) => void;
  accessCodeData?: any;
}

const sectionDescriptions: Record<number, string> = {
  1: "Let's start with some basic information about you and your current situation.",
  2: "Now we'll explore how you think, make decisions, and approach work challenges.",
  3: "What drives you? Let's understand your core values and what motivates you professionally.",
  4: "Time to dive into your interests, skills, and professional aspirations.",
  5: "How do you work best with others? Let's explore your team and leadership preferences.",
  6: "Understanding emotions and relationships is crucial for career success.",
  7: "Finally, let's talk about your future goals and development aspirations."
};

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
  const [showSectionIntro, setShowSectionIntro] = useState(true);
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
  
  // Calculate progress within current section only
  const currentQuestionInSection = currentQuestionIndex + 1;
  const totalQuestionsInSection = currentSection.questions.length;
  const progress = (currentQuestionInSection / totalQuestionsInSection) * 100;

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isCurrentQuestionComplete = () => {
    if (!currentQuestion.required) return true;
    const response = responses[currentQuestion.id];
    
    // Special handling for different question types
    if (currentQuestion.type === 'multiple_choice' && currentQuestion.allow_multiple) {
      const maxSelections = currentQuestion.config?.max_selections;
      if (maxSelections) {
        // For questions with max selections, require exact number
        return Array.isArray(response) && response.length === maxSelections;
      }
      // For questions without max selections, require at least one
      return Array.isArray(response) && response.length > 0;
    }
    
    if (currentQuestion.type === 'ranking') {
      // For ranking questions, ensure all items are ranked
      const choices = currentQuestion.config?.choices || [];
      return Array.isArray(response) && response.length === choices.length;
    }
    
    return response !== undefined && response !== null && response !== '';
  };

  const handleSectionIntroContinue = () => {
    setShowSectionIntro(false);
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
      setShowSectionIntro(true); // Show intro for next section
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
      setShowSectionIntro(false); // Go directly to questions, not intro
    }
  };

  const isLastQuestion = () => {
    return currentSectionIndex === survey.sections.length - 1 && 
           currentQuestionIndex === currentSection.questions.length - 1;
  };

  const isFirstQuestion = () => {
    return currentSectionIndex === 0 && currentQuestionIndex === 0 && !showSectionIntro;
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

  // Show section introduction if we're at the start of a section (except first section first time)
  if (showSectionIntro && !(currentSectionIndex === 0 && currentQuestionIndex === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <SectionIntroduction
          sectionNumber={currentSectionIndex + 1}
          sectionTitle={currentSection.title}
          description={sectionDescriptions[currentSectionIndex + 1] || "Let's continue with the next set of questions."}
          onContinue={handleSectionIntroContinue}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with smaller, grey title */}
      <div className="mb-12">
        <h1 className="text-lg font-normal text-gray-600 mb-8">{survey.title}</h1>
        
        {/* Progress with section info */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-atlas-navy">
              Section {currentSectionIndex + 1}. {currentSection.title}
            </span>
            <span className="text-sm font-bold text-atlas-navy">
              Q. {currentQuestionInSection} of {totalQuestionsInSection}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Current Question */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="text-lg font-medium text-gray-900">
            <QuestionRenderer
              key={currentQuestion.id}
              question={currentQuestion}
              value={responses[currentQuestion.id]}
              onChange={(value) => handleResponseChange(currentQuestion.id, value)}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirstQuestion()}
              className={isFirstQuestion() ? "text-muted-foreground" : "text-atlas-teal hover:text-atlas-teal"}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {!isLastQuestion() ? (
              <Button
                onClick={handleNext}
                disabled={!isCurrentQuestionComplete()}
                className={!isCurrentQuestionComplete() ? "opacity-50" : "bg-atlas-teal hover:bg-atlas-teal/90"}
                style={!isCurrentQuestionComplete() ? { backgroundColor: '#99cccc' } : {}}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isCurrentQuestionComplete() || isSubmitting}
                className={!isCurrentQuestionComplete() ? "opacity-50" : "bg-atlas-teal hover:bg-atlas-teal/90"}
                style={!isCurrentQuestionComplete() ? { backgroundColor: '#99cccc' } : {}}
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
