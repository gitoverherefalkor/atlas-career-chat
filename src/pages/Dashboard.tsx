
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, LogOut, Settings, Play, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import { useSurveySession } from '@/hooks/useSurveySession';
import ReportDisplay from '@/components/ReportDisplay';
import PurchaseAccessButton from '@/components/dashboard/PurchaseAccessButton';


const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { reports, isLoading: reportsLoading } = useReports();
  const [isReportSectionExpanded, setIsReportSectionExpanded] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for saved assessment progress
  const { getStoredSession } = useSurveySession('00000000-0000-0000-0000-000000000001');
  const savedSession = getStoredSession();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You've been signed out successfully.",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getSectionProgress = (session: any) => {
    if (!session) return '';
    const currentSection = session.currentSectionIndex + 1;
    const currentQuestion = session.currentQuestionIndex + 1;
    return `Section ${currentSection}, Question ${currentQuestion}`;
  };

  const getLatestReport = () => {
    if (!reports || reports.length === 0) return null;
    return reports[0]; // Reports are ordered by created_at desc
  };

  // Check if this is truly a returning user - ONLY based on reports, not saved sessions
  const isReturningUser = () => {
    return reports && reports.length > 0;
  };

  // Check if there's meaningful assessment progress (not just at question 1)
  const hasMeaningfulProgress = () => {
    if (!savedSession) return false;
    
    // Only show continue if they're beyond the first question OR have actual responses
    const beyondFirstQuestion = savedSession.currentSectionIndex > 0 || savedSession.currentQuestionIndex > 0;
    const hasResponses = savedSession.responses && Object.keys(savedSession.responses).length > 0;
    
    return beyondFirstQuestion || hasResponses;
  };

  // Check if user has already verified access code (meaning they don't need purchase/access code options)
  const hasVerifiedAccess = () => {
    return savedSession?.isVerified || savedSession?.accessCodeData || hasMeaningfulProgress();
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || user.email;

  const latestReport = getLatestReport();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-atlas-navy">Atlas Assessment</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {displayName}
                </span>
              </div>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="destructive"
          className="mb-6"
          onClick={() => {
            localStorage.removeItem('survey_session_00000000-0000-0000-0000-000000000001');
            localStorage.removeItem('pre_survey_upload_complete');
            window.location.reload();
          }}
        >
          Reset/Clear Progress
        </Button>
        {/* Welcome Section - Only show when report section is not expanded */}
        {!isReportSectionExpanded && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isReturningUser() ? 'Welcome back' : 'Welcome'}{profile?.first_name ? `, ${profile.first_name}` : ''}!
              </h2>
              <p className="text-gray-600">
                Your secure space to manage career assessments and view personalized reports.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Continue Assessment Card - Only show if there's meaningful progress */}
              {hasMeaningfulProgress() && (
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/assessment')}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Play className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Continue Assessment</h3>
                        <p className="text-sm text-gray-600">Resume where you left off: {getSectionProgress(savedSession)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Only show purchase and access code options if user hasn't verified access yet */}
              {!hasVerifiedAccess() && (
                <>
                  {/* Purchase Access Button */}
                  <PurchaseAccessButton />

                  {/* Manual Access Code Entry */}
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/assessment')}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Already have an access code?</h3>
                          <p className="text-sm text-gray-600">Enter your access code to start the assessment</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </>
        )}

        {/* Report Display */}
        {latestReport && (
          <>
            {/* Show pending review message if report is not completed */}
            {latestReport.status === 'pending_review' && (() => {
              const hasExistingSession = localStorage.getItem('sessionId');
              console.log('📊 Dashboard session check:', {
                hasExistingSession,
                allKeys: Object.keys(localStorage),
                sessionId: localStorage.getItem('sessionId')
              });

              return (
                <Card className="mb-6 border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">
                          {hasExistingSession ? 'Continue Your Career Chat' : 'Your Report is Ready for Review!'}
                        </h3>
                        <p className="text-blue-800 mb-4">
                          {hasExistingSession
                            ? 'Pick up where you left off in your career coaching conversation.'
                            : 'Your personalized career assessment has been generated. To unlock your final report, complete a brief conversation with our AI to refine and personalize your insights based on your feedback.'
                          }
                        </p>
                        <Button
                          onClick={() => navigate('/chat')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {hasExistingSession ? 'Continue Chat' : 'Start AI Chat to Unlock Report'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Show processing message if report is still being generated */}
            {latestReport.status === 'processing' && (
              <Card className="mb-6 border-gray-200 bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-gray-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Your Report is Being Generated</h3>
                      <p className="text-gray-700">
                        Our AI is analyzing your survey responses and creating your personalized career assessment.
                        This usually takes 5-10 minutes. You'll receive an email when it's ready.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Only show full report if status is completed */}
            {latestReport.status === 'completed' && (
              <ReportDisplay
                userEmail={profile?.email}
                onSectionExpanded={setIsReportSectionExpanded}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
