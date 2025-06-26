
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useAssessmentNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExitAssessment = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit the assessment? Your progress will be saved and you can continue later."
    );
    
    if (confirmExit) {
      navigate('/dashboard');
    }
  };

  const redirectToAuth = () => {
    console.log('No user, redirecting to auth');
    toast({
      title: "Authentication Required",
      description: "Please sign in to take the assessment.",
      variant: "destructive",
    });
    navigate('/auth');
  };

  return {
    handleExitAssessment,
    redirectToAuth
  };
};
