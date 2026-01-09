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

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-center py-8 text-red-600">Something went wrong. Please refresh or contact support.</div>;
    }
    return this.props.children;
  }
}

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
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  // Custom hooks for state management
  const surveyState = useSurveyState(surveyId);
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
  } = surveyState;

  // IMPORTANT: Call ALL hooks unconditionally
  useResumePreFill({ isSessionLoaded, responses, setResponses, surveyId });

  const surveyNavigation = useSurveyNavigation({
    survey,
    currentSectionIndex,
    currentQuestionIndex,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
    setShowSectionIntro,
    setCompletedSections,
    getFilteredQuestions
  });
  const { handleNext, handleBack, handleSectionNavigation } = surveyNavigation;

  const surveySubmission = useSurveySubmission({
    surveyId,
    responses,
    accessCodeData,
    setIsSubmitting,
    setSubmissionStatus,
    onComplete
  });
  const { handleSubmit, handleRetrySubmission } = surveySubmission;

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

      // Check if response is an object with rankings
      if (!response || typeof response !== 'object') return false;

      // Check if all items have been ranked
      const rankedItems = Object.keys(response).filter(key =>
        response[key] !== null && response[key] !== undefined
      );

      // All choices must be ranked
      return rankedItems.length === choices.length;
    }

    if (question.type === 'career_history') {
      // For career history, validate that all active entries have companySize and companyCulture
      if (!Array.isArray(response)) return false;

      // Check each entry that has a title (active entries)
      for (const entry of response) {
        // If entry has a title, it's considered active and must have size and culture
        if (entry.title && entry.title.trim()) {
          if (!entry.companySize || !entry.companyCulture) {
            return false; // Active entry missing required fields
          }
        }
      }

      // At least one entry must be active
      const hasActiveEntry = response.some(entry => entry.title && entry.title.trim());
      return hasActiveEntry;
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

  const handleResponseChange = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, [setResponses]);

  const handleSectionIntroContinue = useCallback(() => {
    setShowSectionIntro(false);
  }, [setShowSectionIntro]);

  const handleClearSession = useCallback(() => {
    clearSession();
    navigate('/dashboard');
  }, [clearSession, navigate]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // NOW we can do conditional returns, AFTER all hooks have been called
  
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

  const isCurrentQuestionComplete = () => {
    return checkIfCurrentQuestionComplete(currentQuestion);
  };

  const isLastQuestion = () => {
    return currentSectionIndex === survey.sections.length - 1 && 
           currentQuestionIndex === filteredQuestions.length - 1;
  };

  const isFirstQuestion = () => {
    return currentSectionIndex === 0 && currentQuestionIndex === 0 && !showSectionIntro;
  };

  // Show section introduction for all sections (including first)
  if (showSectionIntro) {
    // Unlock the current section as soon as its intro is shown
    if (!completedSections.includes(currentSectionIndex)) {
      setCompletedSections(prev => prev.includes(currentSectionIndex) ? prev : [...prev, currentSectionIndex]);
    }
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
    <ErrorBoundary>
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

          {/* Navigation (adjusted spacing) */}
          <div className="flex justify-between mt-4 mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirstQuestion() || submissionStatus === 'submitted'}
              className={isFirstQuestion() ? "text-muted-foreground" : "text-atlas-teal hover:text-atlas-teal"}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={isLastQuestion() ? handleSubmit : handleNext}
              disabled={
                submissionStatus === 'submitted' ||
                !isCurrentQuestionComplete() ||
                isLoading ||
                isSubmitting
              }
              className="bg-atlas-teal text-white hover:bg-atlas-teal/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isLastQuestion() ? (
                <>
                  Submit
                  <Send className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Current Question */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="text-lg font-light text-gray-900">
                <QuestionRenderer
                  key={currentQuestion.id}
                  question={currentQuestion}
                  value={responses[currentQuestion.id]}
                  onChange={(value) => handleResponseChange(currentQuestion.id, value)}
                  allResponses={responses}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};