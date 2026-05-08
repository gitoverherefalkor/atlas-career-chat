
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, Settings, Play, FileText, Download, Briefcase, Search, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import ReportDisplay from '@/components/ReportDisplay';
import ReportPreview from '@/components/report/ReportPreview';
import { AccessCodeModal } from '@/components/dashboard/AccessCodeModal';
import { ExecSummaryModal } from '@/components/dashboard/ExecSummaryModal';
import { CareerQuadrant } from '@/components/dashboard/CareerQuadrant';
import { CareerSignatureCard } from '@/components/chat/CareerSignatureCard';
import { CareerSignatureModal } from '@/components/dashboard/CareerSignatureModal';
import { PersonalityRadar } from '@/components/dashboard/PersonalityRadar';
import { useReportSections, SECTION_TYPE_MAP } from '@/hooks/useReportSections';
import { useEngagementTracking } from '@/hooks/useEngagementTracking';

// Helper to get assessment session from localStorage
const getAssessmentSession = () => {
  try {
    const stored = localStorage.getItem('assessment_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { reports, isLoading: reportsLoading } = useReports();
  const [isReportSectionExpanded, setIsReportSectionExpanded] = useState(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  // Career Signature opens in a modal when the user clicks the compact
  // dashboard card. Modal renders the full standalone version of the card.
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showExecSummaryModal, setShowExecSummaryModal] = useState(false);
  const [userAccessCode, setUserAccessCode] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // If user explicitly navigated here (e.g. from chat), don't auto-redirect back
  const cameFromChat = location.state?.fromChat === true;

  // Check for saved assessment progress
  const savedSession = getAssessmentSession();

  // Compute latestReport early so we can pass it to hooks (hooks can't be after conditional returns)
  const latestReport = (!reports || reports.length === 0) ? null : reports[0];

  // Fetch report sections to check for exec summary (hook must be called unconditionally)
  const { sections: reportSections } = useReportSections(latestReport?.id);
  const execSummarySection = reportSections.find(
    (s) => s.section_type === 'exec_summary' || s.section_type === 'executive_summary'
  );

  // Track dashboard visit for users who have completed chat
  const { trackDashboardVisit } = useEngagementTracking();
  useEffect(() => {
    if (latestReport && latestReport.status === 'completed') {
      trackDashboardVisit();
    }
  }, [latestReport?.id]);

  // Show exec summary modal on first visit after report completion
  useEffect(() => {
    if (!latestReport || latestReport.status !== 'completed' || !execSummarySection) return;
    const dismissKey = `exec_summary_dismissed_${latestReport.id}`;
    if (!localStorage.getItem(dismissKey)) {
      setShowExecSummaryModal(true);
    }
  }, [latestReport, execSummarySection]);

  const handleDismissExecSummary = () => {
    setShowExecSummaryModal(false);
    if (latestReport) {
      localStorage.setItem(`exec_summary_dismissed_${latestReport.id}`, 'true');
    }
  };

  // Same dismiss + flag set, but also scroll the user to the report
  // chapter cards. Wrapped in setTimeout so the modal's exit unmounts
  // before we scroll — otherwise the body-scroll-lock useEffect cleanup
  // races the scroll and lands you back at the top.
  const handleExploreReport = () => {
    handleDismissExecSummary();
    setTimeout(() => {
      const target = document.getElementById('report-display-anchor');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Check if user has an access code in metadata or localStorage (social signup fallback)
  useEffect(() => {
    if (user && !authLoading && !profileLoading && !reportsLoading) {
      // Check user_metadata first (email signups), then localStorage (social signups from payment flow)
      let accessCode = user.user_metadata?.access_code;
      if (!accessCode) {
        try {
          const purchaseData = localStorage.getItem('purchase_data');
          if (purchaseData) {
            accessCode = JSON.parse(purchaseData).accessCode || null;
          }
        } catch {
          // Ignore parse errors
        }
      }
      if (accessCode) {
        setUserAccessCode(accessCode);
        // Only show modal if user hasn't verified/started assessment yet
        const hasStarted = savedSession?.isVerified || savedSession?.accessCodeData ||
          (savedSession?.responses && Object.keys(savedSession.responses).length > 0);
        const hasReport = reports && reports.length > 0;

        if (!hasStarted && !hasReport) {
          setShowAccessCodeModal(true);
        }
      }

      // Update profile with country from localStorage if available (from payment form)
      const paymentCountry = localStorage.getItem('payment_country');
      if (paymentCountry && profile && !profile.country) {
        supabase
          .from('profiles')
          .update({ country: paymentCountry })
          .eq('id', user.id)
          .then(() => {
            console.log('Profile updated with country from payment:', paymentCountry);
            localStorage.removeItem('payment_country');
          })
          .catch((error) => {
            console.error('Error updating profile with country:', error);
          });
      }
    }
  }, [user, authLoading, profileLoading, reportsLoading, reports, profile]);

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

  // Check if this is truly a returning user - ONLY based on reports, not saved sessions
  const isReturningUser = () => {
    return reports && reports.length > 0;
  };

  // Check if there's meaningful assessment progress or a started session
  const hasMeaningfulProgress = () => {
    if (!savedSession) return false;

    // Show continue if:
    // 1. They're beyond the first question
    // 2. They have any responses saved
    // 3. They have verified access (entered access code)
    const beyondFirstQuestion = savedSession.currentSectionIndex > 0 || savedSession.currentQuestionIndex > 0;
    const hasResponses = savedSession.responses && Object.keys(savedSession.responses).length > 0;
    const hasVerified = savedSession.isVerified || savedSession.accessCodeData;

    return beyondFirstQuestion || hasResponses || hasVerified;
  };

  // Check if user has already verified access code (meaning they don't need purchase/access code options)
  // Also true if they have a report generated or started a chat session
  const hasVerifiedAccess = () => {
    const hasReport = reports && reports.length > 0;
    const hasChatSession = !!localStorage.getItem('n8n-chat/sessionId');
    return savedSession?.isVerified || savedSession?.accessCodeData || hasMeaningfulProgress() || hasReport || hasChatSession;
  };

  // Redirects must happen in useEffect, not during render.
  // navigate() called during render is a no-op in React Router 6 and causes blank pages.
  const needsAuthRedirect = !authLoading && !user;
  const needsProcessingRedirect = !authLoading && !reportsLoading && latestReport?.status === 'processing';
  const needsChatRedirect = !authLoading && !reportsLoading && latestReport?.status === 'pending_review' && !cameFromChat;

  useEffect(() => {
    if (needsAuthRedirect) {
      navigate('/auth', { replace: true });
    } else if (needsProcessingRedirect) {
      navigate('/report-processing', { replace: true });
    } else if (needsChatRedirect) {
      navigate('/chat', { replace: true });
    }
  }, [needsAuthRedirect, needsProcessingRedirect, needsChatRedirect, navigate]);

  // Show loading spinner while data is loading OR a redirect is about to happen
  if (authLoading || profileLoading || reportsLoading || needsAuthRedirect || needsProcessingRedirect || needsChatRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/atlas-logo.png" alt="Cairnly" className="h-28 w-auto" />
            </div>
            <div className="flex items-center space-x-3">
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
        {/* Welcome Section - Only show when report section is not expanded */}
        {!isReportSectionExpanded && (
          <>
            {/* Welcome Header — hardcoded cream because the editorial
                palette is applied via custom CSS rather than Tailwind's
                dark-mode class strategy, so `text-foreground` would resolve
                to the LIGHT-mode dark navy and stay illegible on the
                teal-navy canvas. */}
            <h2 className="text-3xl font-bold text-[#F5F5F5] mb-6">
              {isReturningUser() ? 'Welcome back' : 'Welcome'}{profile?.first_name ? `, ${profile.first_name}` : ''}
            </h2>

            {/* Top row — two columns. Left: Career Report card with the
                Quick Actions list folded inside. Right: full-size Career
                Signature (the data-card replaces the old Quick Actions
                slot). Personality Radar / Career Map have moved DOWN
                onto the chapter columns where they act as section
                headers. */}
            {latestReport && latestReport.status === 'completed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Career Report + Quick Actions merged */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="bg-atlas-teal/10 p-3 rounded-full">
                        <FileText className="h-6 w-6 text-atlas-teal" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Your Career Report</h3>
                        <p className="text-sm text-atlas-teal font-medium mb-1">Atlas Personality & Career Assessment 2025</p>
                        <p className="text-sm text-gray-500">
                          Completed {latestReport.updated_at ? new Date(latestReport.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>

                    {/* Provenance line — was floating in dark space between
                        the top row and the chapter columns where it was
                        illegible. Lives here now as a subtle subtitle. */}
                    <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-3 mb-4">
                      These insights are adjusted based on feedback provided in the chat where relevant.
                    </p>

                    {/* Quick Actions list — folded into the Career Report
                        card per the dashboard restructure. Items are still
                        Coming Soon, just shown more compactly. */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                        Quick Actions
                      </h4>
                      <div className="space-y-1.5">
                        <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg text-gray-400 cursor-not-allowed">
                          <Download className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">Download Recruiter Summary</span>
                          <span className="text-xs text-gray-400 ml-auto">Coming soon</span>
                        </button>
                        <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg text-gray-400 cursor-not-allowed">
                          <Briefcase className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">CV Optimizer</span>
                          <span className="text-xs text-gray-400 ml-auto">Coming soon</span>
                        </button>
                        <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg text-gray-400 cursor-not-allowed">
                          <Search className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">Check Job Openings</span>
                          <span className="text-xs text-gray-400 ml-auto">Coming soon</span>
                        </button>
                        <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg text-gray-400 cursor-not-allowed">
                          <PlusCircle className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">More Assessments</span>
                          <span className="text-xs text-gray-400 ml-auto">Coming soon</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Career Signature — full-size inline. The click-to-modal
                    behavior was redundant (modal showed the same card)
                    and was removed. The footer Share CTA will eventually
                    open a dedicated share flow (LinkedIn, PNG export);
                    for now it's wired to the modal as a placeholder. */}
                <CareerSignatureCard
                  reportId={latestReport.id}
                  variant="full"
                  onShare={() => setShowSignatureModal(true)}
                />
              </div>
            )}

            {/* Resume chat — when the user navigated to the dashboard from
                an in-progress chat session (status === 'pending_review' and
                cameFromChat suppresses the auto-redirect). Without this card
                the page is empty except for the welcome heading. */}
            {latestReport?.status === 'pending_review' && (
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer mb-8"
                onClick={() => navigate('/chat')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-atlas-teal/10 p-3 rounded-full">
                        <Play className="h-6 w-6 text-atlas-teal" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Pick up where you left off</h3>
                        <p className="text-sm text-gray-600">
                          Your chat session is still in progress. Finish it to unlock your full report and Career Signature.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}>
                      Resume Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue Assessment Card - Only show if there's meaningful progress AND no report exists */}
            {hasMeaningfulProgress() && !latestReport && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer mb-8" onClick={() => navigate('/assessment')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Play className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Continue Assessment</h3>
                      <p className="text-sm text-gray-600">Resume where you left off</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Show assessment start card if user hasn't verified access yet */}
            {!hasVerifiedAccess() && (
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer mb-8"
                onClick={() => userAccessCode ? setShowAccessCodeModal(true) : navigate('/assessment')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Briefcase className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Start Your Assessment</h3>
                      <p className="text-sm text-gray-500">Assessment not started</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Report Display or Preview */}
        {latestReport ? (
          <>
            {/* Note: 'processing' redirects to /report-processing, 'pending_review' redirects to /chat */}

            {/* Only show full report if status is completed.
                The id is the scroll anchor for the ExecSummaryModal's
                "Explore Your Report" button — landing here drops the user
                right at the chapter cards instead of leaving them at the
                top of the dashboard.

                customChapterHeaders plug the Personality Radar and Career
                Map directly into each chapter column as the visual header,
                replacing the old striped/circle banners. `bare` strips the
                charts' own outer card wrapper so they nest cleanly inside
                ChapterCard's outer Card. */}
            {latestReport.status === 'completed' && (
              <div id="report-display-anchor">
                <ReportDisplay
                  userEmail={profile?.email}
                  onSectionExpanded={setIsReportSectionExpanded}
                  customChapterHeaders={{
                    'about-you': (
                      <PersonalityRadar sections={reportSections} bare />
                    ),
                    'career-suggestions': (
                      // variant="compact" gives the small uppercase
                      // "CAREER MAP" tag instead of the verbose h3
                      // "Your Career Map" — matches the Personality Radar
                      // header style on the left column.
                      <CareerQuadrant sections={reportSections} variant="compact" bare />
                    ),
                  }}
                />
              </div>
            )}
          </>
        ) : (
          /* Show report preview when no report exists yet — hide CTA if assessment is already in progress */
          <ReportPreview onStartAssessment={hasMeaningfulProgress() ? undefined : () => userAccessCode ? setShowAccessCodeModal(true) : navigate('/assessment')} />
        )}
      </div>

      {/* Access Code Modal */}
      {showAccessCodeModal && userAccessCode && (
        <AccessCodeModal
          accessCode={userAccessCode}
          onClose={() => setShowAccessCodeModal(false)}
        />
      )}

      {/* Career Signature Modal — full-size card on click of the compact
          hero block. Mounted unconditionally so the close animation can
          play; component returns null when open=false. */}
      {latestReport?.id && (
        <CareerSignatureModal
          reportId={latestReport.id}
          open={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {/* Executive Summary Modal — shown on first visit after report completion */}
      {showExecSummaryModal && execSummarySection && (
        <ExecSummaryModal
          content={execSummarySection.content}
          onClose={handleDismissExecSummary}
          onViewReport={handleExploreReport}
        />
      )}
    </div>
  );
};

export default Dashboard;
