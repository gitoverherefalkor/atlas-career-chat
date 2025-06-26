import React, { useState, useEffect, useCallback } from 'react';
import { useSurvey } from '@/hooks/useSurvey';
import { useSurveySession } from '@/hooks/useSurveySession';
import { QuestionRenderer } from './QuestionRenderer';
import { SectionIntroduction } from './SectionIntroduction';
import { SurveyNavigation } from './SurveyNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { mapResumeToSurveyAnswers } from '@/utils/resumeToSurveyMapper';

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
  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL CALLS
  const { data: survey, isLoading, error } = useSurvey(surveyId);
  const { getStoredSession, saveSession, clearSession } = useSurveySession(surveyId);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'submitted' | 'failed'>('idle');
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Helper function to check if a question should be skipped
  const shouldSkipQuestion = useCallback((question: any) => {
    const licenseKeyIndicators = ['license', 'access code', 'verification code', 'license key'];
    const questionText = question.label?.toLowerCase() || '';
    return licenseKeyIndicators.some(indicator => questionText.includes(indicator));
  }, []);

  // Get filtered questions for current section (excluding license key questions)
  const getFilteredQuestions = useCallback((section: any) => {
    return section.questions.filter((q: any) => !shouldSkipQuestion(q));
  }, [shouldSkipQuestion]);

  // Load session on mount - ONLY ONCE
  useEffect(() => {
    if (survey && !isSessionLoaded) {
      console.log('Loading session for the first time...');
      const storedSession = getStoredSession();
      if (storedSession) {
        console.log('Restoring session:', storedSession);
        setResponses(storedSession.responses);
        setCurrentSectionIndex(storedSession.currentSectionIndex);
        setCurrentQuestionIndex(storedSession.currentQuestionIndex);
        setShowSectionIntro(storedSession.showSectionIntro);
        setCompletedSections(storedSession.completedSections);
        
        // Check if this session was previously submitted
        const submissionData = storedSession as any;
        if (submissionData.submissionStatus) {
          setSubmissionStatus(submissionData.submissionStatus);
        }
      }
      setIsSessionLoaded(true);
    }
  }, [survey, isSessionLoaded, getStoredSession]);

  // Load resume data and apply pre-fills - ONLY ONCE after session is loaded
  useEffect(() => {
    if (survey && isSessionLoaded && user && Object.keys(responses).length === 0) {
      console.log('Checking for resume data to pre-fill...');
      
      // Get user profile with resume data
      supabase
        .from('profiles')
        .select('resume_data')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile, error }) => {
          if (error) {
            console.error('Error fetching profile for pre-fill:', error);
            return;
          }

          console.log('Profile data retrieved:', profile);
          console.log('Resume data type:', typeof profile?.resume_data);
          console.log('Resume data content:', profile?.resume_data);

          if (profile?.resume_data) {
            // Check if resume_data is a string (raw text) or structured object
            if (typeof profile.resume_data === 'string') {
              console.log('Resume data is raw text, length:', profile.resume_data.length);
              console.log('First 200 characters:', profile.resume_data.substring(0, 200));
              
              // For now, let's try to extract some basic info from the raw text
              const resumeText = profile.resume_data.toLowerCase();
              const preFillData: Record<string, any> = {};
              
              // Try to extract email
              const emailMatch = profile.resume_data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch) {
                preFillData['email'] = emailMatch[0];
                console.log('Extracted email:', emailMatch[0]);
              }
              
              // Try to extract phone number
              const phoneMatch = profile.resume_data.match(/(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
              if (phoneMatch) {
                preFillData['phone'] = phoneMatch[0];
                console.log('Extracted phone:', phoneMatch[0]);
              }
              
              // Look for common job titles
              const jobTitlePatterns = [
                /manager/i, /director/i, /analyst/i, /developer/i, /engineer/i, 
                /coordinator/i, /specialist/i, /consultant/i, /administrator/i
              ];
              
              for (const pattern of jobTitlePatterns) {
                const match = profile.resume_data.match(new RegExp(`\\b\\w*${pattern.source}\\w*\\b`, 'i'));
                if (match) {
                  preFillData['current_job_title'] = match[0];
                  console.log('Extracted job title:', match[0]);
                  break;
                }
              }
              
              if (Object.keys(preFillData).length > 0) {
                console.log('Setting pre-fill data from raw text:', preFillData);
                setResponses(preFillData);
                toast({
                  title: "Survey Pre-filled",
                  description: `${Object.keys(preFillData).length} fields have been pre-filled from your resume. Please review and update as needed.`,
                });
              } else {
                console.log('No extractable data found in resume text');
                toast({
                  title: "Resume Uploaded",
                  description: "Your resume was processed but no specific fields could be automatically filled. You can reference your resume while filling out the survey.",
                });
              }
              
            } else if (typeof profile.resume_data === 'object') {
              console.log('Resume data is structured object, applying mapper...');
              const preFillData = mapResumeToSurveyAnswers(profile.resume_data as any);
              
              if (Object.keys(preFillData).length > 0) {
                console.log('Setting pre-fill data from structured object:', preFillData);
                setResponses(preFillData);
                toast({
                  title: "Survey Pre-filled",
                  description: `${Object.keys(preFillData).length} fields have been pre-filled from your resume. Please review and update as needed.`,
                });
              }
            }
          } else {
            console.log('No resume data found in profile');
          }
        });
    }
  }, [survey, isSessionLoaded, user, responses, toast]);

  // Save session whenever state changes - but only after session is loaded
  useEffect(() => {
    if (survey && isSessionLoaded) {
      const session = {
        responses,
        currentSectionIndex,
        currentQuestionIndex,
        showSectionIntro,
        completedSections,
        submissionStatus
      };
      console.log('Saving session:', session);
      saveSession(session);
    }
  }, [responses, currentSectionIndex, currentQuestionIndex, showSectionIntro, completedSections, submissionStatus, survey, saveSession, isSessionLoaded]);

  // Navigation functions
  const handleNext = useCallback(() => {
    if (!survey) return;
    
    const filteredQuestions = getFilteredQuestions(survey.sections[currentSectionIndex]);
    
    // If this was the last question in the section, mark section as completed
    if (currentQuestionIndex === filteredQuestions.length - 1) {
      setCompletedSections(prev => {
        if (!prev.includes(currentSectionIndex)) {
          return [...prev, currentSectionIndex];
        }
        return prev;
      });
    }

    // Move to next question in current section
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } 
    // Move to first question of next section
    else if (currentSectionIndex < survey.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
      setShowSectionIntro(true); // Show intro for next section
    }
  }, [survey, currentSectionIndex, currentQuestionIndex, getFilteredQuestions]);

  const handleBack = useCallback(() => {
    if (!survey) return;
    
    // Move to previous question in current section
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    // Move to last question of previous section
    else if (currentSectionIndex > 0) {
      const prevSection = survey.sections[currentSectionIndex - 1];
      const prevFilteredQuestions = getFilteredQuestions(prevSection);
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(prevFilteredQuestions.length - 1);
      setShowSectionIntro(false); // Go directly to questions, not intro
    }
  }, [survey, currentSectionIndex, currentQuestionIndex, getFilteredQuestions]);

  const handleSubmit = useCallback(async () => {
    if (!survey || !accessCodeData || !user) return;
    
    setIsSubmitting(true);
    setSubmissionStatus('submitting');

    try {
      console.log('Submitting survey responses:', responses);
      console.log('Access code data:', accessCodeData);
      console.log('User:', user);

      // Submit to database with access code reference
      const answerData: any = {
        survey_id: surveyId,
        payload: responses,
        access_code_id: accessCodeData?.id
      };

      const { data: submissionData, error: submissionError } = await supabase
        .from('answers')
        .insert(answerData)
        .select();

      if (submissionError) {
        console.error('Error submitting survey:', submissionError);
        setSubmissionStatus('failed');
        toast({
          title: "Submission Failed",
          description: "Failed to submit your responses. Please try again - your answers are saved.",
          variant: "destructive",
        });
        return;
      }

      console.log('Survey submitted successfully:', submissionData);

      // Mark access code as used after successful submission
      await markAccessCodeAsUsed();

      setSubmissionStatus('submitted');

      toast({
        title: "Survey Submitted Successfully",
        description: "Your responses are saved. Your report is being generated and you'll receive an email when ready.",
      });

      // Call completion handler (but don't clear session yet)
      onComplete(responses);
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSubmissionStatus('failed');
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again - your answers are saved.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [survey, accessCodeData, user, responses, surveyId, onComplete, toast]);

  const markAccessCodeAsUsed = useCallback(async () => {
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
  }, [accessCodeData]);

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
  }, [survey, currentSectionIndex, currentQuestionIndex, responses, handleSubmit, handleNext, getFilteredQuestions]);

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

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // NOW WE CAN HAVE CONDITIONAL RENDERING AND EARLY RETURNS
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

  const handleSectionNavigation = (sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(0);
    setShowSectionIntro(true);
  };

  const isLastQuestion = () => {
    return currentSectionIndex === survey.sections.length - 1 && 
           currentQuestionIndex === filteredQuestions.length - 1;
  };

  const isFirstQuestion = () => {
    return currentSectionIndex === 0 && currentQuestionIndex === 0 && !showSectionIntro;
  };

  const handleRetrySubmission = () => {
    setSubmissionStatus('idle');
    handleSubmit();
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
