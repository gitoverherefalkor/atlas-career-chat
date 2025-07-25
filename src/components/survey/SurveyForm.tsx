
import React, { useEffect, useCallback } from 'react';
import { QuestionRenderer } from './QuestionRenderer';
import { SectionIntroduction } from './SectionIntroduction';
import { SurveyNavigation } from './SurveyNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSurveyState } from './hooks/useSurveyState';
import { useResumePreFill } from './hooks/useResumePreFill';
import { useSurveyNavigation } from './hooks/useSurveyNavigation';
import { useSurveySubmission } from './hooks/useSurveySubmission';

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
  const navigate = useNavigate();
  
  // Custom hooks for state management
  const {
    survey,
    isLoading,
    error,
    currentSectionIndex,
    currentQuestionIndex,
    responses,
    isSubmitting,
    submissionStatus,
    showSectionIntro,
    completedSections,
    isSessionLoaded,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
    setResponses,
    setIsSubmitting,
    setSubmissionStatus,
    setShowSectionIntro,
    setCompletedSections,
    shouldSkipQuestion,
    getFilteredQuestions,
    clearSession
  } = useSurveyState(surveyId);

  // Resume pre-fill functionality
  useResumePreFill({ isSessionLoaded, responses, setResponses });

  // Navigation functionality
  const { handleNext, handleBack, handleSectionNavigation } = useSurveyNavigation({
    survey,
    currentSectionIndex,
    currentQuestionIndex,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
    setShowSectionIntro,
    setCompletedSections,
    getFilteredQuestions
  });

  // Submission functionality
  const { handleSubmit, handleRetrySubmission } = useSurveySubmission({
    surveyId,
    responses,
    accessCodeData,
    setIsSubmitting,
    setSubmissionStatus,
    onComplete
  });

  // Helper function to check if current question is complete
  const checkIfCurrentQuestionComplete = useCallback((question: any) => {
    if (!question || !question.required) return true;
    const response = responses[question.id];
    
    // Special handling for different question types
    if (question.type === 'multiple_choice' && question.allow_multiple) {
      const minSelections = question.min_selections;
      const maxSelections = question.max_selections;
      
      if (Array.isArray(response)) {
        // Check minimum selections requirement
        if (minSelections && response.length < minSelections) return false;
        // For required questions, need at least one selection if no minimum is set
        if (!minSelections && response.length === 0) return false;
        // Check maximum selections (should be handled in UI but double-check)
        if (maxSelections && response.length > maxSelections) return false;
        return true;
      }
      
      // If no response but minimum required
      if (minSelections && minSelections > 0) return false;
      return response !== undefined && response !== null && response !== '';
    }
    
    if (question.type === 'ranking') {
      // For ranking questions, ensure all items are ranked
      const choices = question.config?.choices || [];
      return Array.isArray(response) && response.length === choices.length;
    }
    
    return response !== undefined && response !== null && response !== '';
  }, [responses]);

  // Keyboard event handler for Enter key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!survey) return;
    
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      // Don't trigger on Enter in textarea or other multi-line inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') {
        return;
      }

      const filteredQuestions = getFilteredQuestions(survey.sections[currentSectionIndex]);
      const currentQuestion = filteredQuestions[currentQuestionIndex];
      const isCurrentQuestionComplete = checkIfCurrentQuestionComplete(currentQuestion);
      const isLastQuestion = currentSectionIndex === survey.sections.length - 1 && 
                           currentQuestionIndex === filteredQuestions.length - 1;

      // Only proceed if current question is complete
      if (isCurrentQuestionComplete) {
        event.preventDefault();
        
        if (isLastQuestion) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    }
  }, [survey, currentSectionIndex, currentQuestionIndex, responses, handleSubmit, handleNext, getFilteredQuestions, checkIfCurrentQuestionComplete]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Loading states
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

  // Don't render anything until session is loaded
  if (!isSessionLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your progress...</span>
      </div>
    );
  }

  const currentSection = survey.sections[currentSectionIndex];
  const filteredQuestions = getFilteredQuestions(currentSection);
  const currentQuestion = filteredQuestions[currentQuestionIndex];
  
  // Calculate progress within current section only
  const currentQuestionInSection = currentQuestionIndex + 1;
  const totalQuestionsInSection = filteredQuestions.length;
  const progress = (currentQuestionInSection / totalQuestionsInSection) * 100;

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isCurrentQuestionComplete = () => {
    return checkIfCurrentQuestionComplete(currentQuestion);
  };

  const handleSectionIntroContinue = () => {
    setShowSectionIntro(false);
  };

  const isLastQuestion = () => {
    return currentSectionIndex === survey.sections.length - 1 && 
           currentQuestionIndex === filteredQuestions.length - 1;
  };

  const isFirstQuestion = () => {
    return currentSectionIndex === 0 && currentQuestionIndex === 0 && !showSectionIntro;
  };

  // Function to manually clear session (only when user confirms everything worked)
  const handleClearSession = () => {
    clearSession();
    navigate('/dashboard');
  };

  // Show section introduction for all sections (including first)
  if (showSectionIntro) {
    const sectionDescription = currentSection.description || "Let's continue with the next set of questions.";
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="flex gap-6 max-w-7xl mx-auto px-6">
          <SurveyNavigation
            sections={survey.sections}
            currentSectionIndex={currentSectionIndex}
            completedSections={completedSections}
            onSectionClick={handleSectionNavigation}
          />
          <div className="flex-1">
            <SectionIntroduction
              sectionNumber={currentSectionIndex + 1}
              sectionTitle={currentSection.title}
              description={sectionDescription}
              onContinue={handleSectionIntroContinue}
            />
          </div>
        </div>
      </div>
    );
  }

  // If no questions available after filtering, show error
  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">No questions available in this section.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="flex gap-6 max-w-7xl mx-auto px-6">
        <SurveyNavigation
          sections={survey.sections}
          currentSectionIndex={currentSectionIndex}
          completedSections={completedSections}
          onSectionClick={handleSectionNavigation}
        />
        
        <div className="flex-1 max-w-4xl">
          {/* Header with smaller, grey title */}
          <div className="mb-12">
            <h1 className="text-lg font-light text-gray-600 mb-8">{survey.title}</h1>
            
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

          {/* Submission Status Banner */}
          {submissionStatus === 'submitted' && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium">Assessment Submitted Successfully!</p>
                    <p className="text-green-700 text-sm">Your responses are saved and your report is being generated. You'll receive an email when it's ready.</p>
                  </div>
                  <Button 
                    onClick={handleClearSession} 
                    variant="outline" 
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {submissionStatus === 'failed' && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">Submission Failed</p>
                    <p className="text-red-700 text-sm">Don't worry - your answers are saved! You can try submitting again.</p>
                  </div>
                  <Button 
                    onClick={handleRetrySubmission} 
                    variant="outline" 
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Retry Submission'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Question */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="text-lg font-light text-gray-900">
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
                  disabled={isFirstQuestion() || submissionStatus === 'submitted'}
                  className={isFirstQuestion() ? "text-muted-foreground" : "text-atlas-teal hover:text-atlas-teal"}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {!isLastQuestion() ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isCurrentQuestionComplete() || submissionStatus === 'submitted'}
                    className={!isCurrentQuestionComplete() ? "opacity-50" : "bg-atlas-teal hover:bg-atlas-teal/90"}
                    style={!isCurrentQuestionComplete() ? { backgroundColor: '#99cccc' } : {}}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={submissionStatus === 'failed' ? handleRetrySubmission : handleSubmit}
                    disabled={(!isCurrentQuestionComplete() && submissionStatus !== 'failed') || isSubmitting || submissionStatus === 'submitted'}
                    className={(!isCurrentQuestionComplete() && submissionStatus !== 'failed') ? "opacity-50" : "bg-atlas-teal hover:bg-atlas-teal/90"}
                    style={(!isCurrentQuestionComplete() && submissionStatus !== 'failed') ? { backgroundColor: '#99cccc' } : {}}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {submissionStatus === 'failed' ? 'Retrying...' : 'Submitting...'}
                      </>
                    ) : submissionStatus === 'submitted' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submitted Successfully
                      </>
                    ) : submissionStatus === 'failed' ? (
                      'Retry Submission'
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
      </div>
    </div>
  );
};
