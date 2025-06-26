
import { useCallback } from 'react';

interface UseSurveyNavigationProps {
  survey: any;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  setCurrentSectionIndex: (index: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setShowSectionIntro: (show: boolean) => void;
  setCompletedSections: (fn: (prev: number[]) => number[]) => void;
  getFilteredQuestions: (section: any) => any[];
}

export const useSurveyNavigation = ({
  survey,
  currentSectionIndex,
  currentQuestionIndex,
  setCurrentSectionIndex,
  setCurrentQuestionIndex,
  setShowSectionIntro,
  setCompletedSections,
  getFilteredQuestions
}: UseSurveyNavigationProps) => {
  
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
  }, [survey, currentSectionIndex, currentQuestionIndex, getFilteredQuestions, setCurrentSectionIndex, setCurrentQuestionIndex, setShowSectionIntro, setCompletedSections]);

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
  }, [survey, currentSectionIndex, currentQuestionIndex, getFilteredQuestions, setCurrentSectionIndex, setCurrentQuestionIndex, setShowSectionIntro]);

  const handleSectionNavigation = (sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(0);
    setShowSectionIntro(true);
  };

  return {
    handleNext,
    handleBack,
    handleSectionNavigation
  };
};
