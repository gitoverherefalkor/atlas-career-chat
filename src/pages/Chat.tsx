import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, MessageSquare, LayoutDashboard, RefreshCw } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { WelcomeCard } from '@/components/chat/WelcomeCard';
import { WelcomeBackCard } from '@/components/chat/WelcomeBackCard';
import { ClosingCard } from '@/components/chat/ClosingCard';
import { ReportSidebar, ALL_SECTIONS } from '@/components/chat/ReportSidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import type { ChatMessagesHandle } from '@/components/chat/ChatMessages';

// ========================================================================
// OLD N8N IMPORTS (preserved, no longer used)
// import DOMPurify from 'dompurify';
// import '@n8n/chat/style.css';
// import '@/styles/n8n-chat.css';
// import { createChat } from '@n8n/chat';
// ========================================================================

type ReportData = Tables<'reports'>;

const Chat = () => {
  // Session management — same localStorage keys as n8n for backward compatibility
  const hasExistingSession = localStorage.getItem('n8n-chat/sessionId') !== null;

  const getSessionTimestamp = () => {
    const timestamp = localStorage.getItem('n8n-chat/sessionTimestamp');
    return timestamp ? parseInt(timestamp) : null;
  };

  const isSessionStale = () => {
    const timestamp = getSessionTimestamp();
    if (!timestamp) return false;
    const hoursSinceLastActivity = (Date.now() - timestamp) / (1000 * 60 * 60);
    return hoursSinceLastActivity > 72;
  };

  const sessionIsStale = hasExistingSession && isSessionStale();

  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showWelcome, setShowWelcome] = useState(!hasExistingSession || sessionIsStale);
  const [showClosing, setShowClosing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [showSessionBanner, setShowSessionBanner] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem('n8n-chat/sessionId')
  );

  const chatMessagesRef = useRef<ChatMessagesHandle>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load report on auth ready
  useEffect(() => {
    if (!authLoading) {
      loadUserReport();
    }
  }, [authLoading, user]);

  // Auto-restore session when returning with existing (non-stale) session
  useEffect(() => {
    if (!reportData || profileLoading || !profile) return;
    if (!hasExistingSession || sessionIsStale) return;
    if (!showWelcome) return; // Already past welcome

    // Update session timestamp
    localStorage.setItem('n8n-chat/sessionTimestamp', Date.now().toString());

    // Restore section progress
    const storedIndex = localStorage.getItem(`chat_section_index_${reportData.id}`);
    if (storedIndex) {
      const index = parseInt(storedIndex, 10);
      if (!isNaN(index)) {
        setCurrentSectionIndex(index);
      }
    }

    // Show session restored banner
    setShowSessionBanner(true);
    setTimeout(() => setShowSessionBanner(false), 5000);

    // Go straight to chat (skip welcome)
    setShowWelcome(false);
  }, [reportData, profileLoading]);

  // Subscribe to report status changes via Supabase Realtime
  useEffect(() => {
    if (!reportData?.id) return;
    if (isSessionCompleted) return;

    const isAtLastSection = currentSectionIndex >= ALL_SECTIONS.length - 1;
    if (!isAtLastSection) return;

    // One-time check
    const checkOnce = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('status')
        .eq('id', reportData.id)
        .single();

      if (!error && data?.status === 'completed') {
        setIsSessionCompleted(true);
      }
    };
    checkOnce();

    // Realtime subscription
    const channel = supabase
      .channel(`report-status-${reportData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `id=eq.${reportData.id}`,
        },
        (payload) => {
          if ((payload.new as any).status === 'completed') {
            setIsSessionCompleted(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportData?.id, currentSectionIndex, isSessionCompleted]);

  // Save section progress to localStorage
  useEffect(() => {
    if (reportData && currentSectionIndex >= 0) {
      localStorage.setItem(`chat_section_index_${reportData.id}`, currentSectionIndex.toString());
    }
  }, [currentSectionIndex, reportData]);

  // Start a new or continued chat session
  const handleStartSession = () => {
    if (profileLoading || !profile) {
      toast({
        title: "Loading...",
        description: "Please wait a moment while we load your profile.",
      });
      return;
    }

    // Generate or reuse session ID
    let sid = localStorage.getItem('n8n-chat/sessionId');
    if (!sid || sessionIsStale) {
      sid = crypto.randomUUID();
      localStorage.setItem('n8n-chat/sessionId', sid);
    }
    localStorage.setItem('n8n-chat/sessionTimestamp', Date.now().toString());

    setSessionId(sid);
    setIsInitializing(true);
    setShowWelcome(false);
    setIsInitializing(false);
  };

  // Section click handler — uses ref to scroll within custom chat
  const handleSectionClick = (sectionId: string, _index: number) => {
    chatMessagesRef.current?.scrollToSection(sectionId);
  };

  // Handle section detected from bot messages — only goes forward
  const handleSectionDetected = (index: number) => {
    setCurrentSectionIndex((prev) => Math.max(prev, index));
  };

  // Determine returning user state
  const storedProgressIndex = reportData
    ? parseInt(localStorage.getItem(`chat_section_index_${reportData.id}`) || '-1', 10)
    : -1;
  const isReturningUser = sessionIsStale && storedProgressIndex >= 0;

  const loadUserReport = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your career coach.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!reports || reports.length === 0) {
        toast({
          title: "No Report Available",
          description: "Complete your assessment first to access the career coach.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setReportData(reports[0]);
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Error",
        description: "Unable to load your report. Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-atlas-blue" />
          <p className="text-gray-600">Loading your career coach...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">No Report Available</h1>
            <p className="text-gray-600 mb-6">
              Complete your assessment to start chatting with your AI career coach.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container-atlas">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <img src="/atlas-logo.png" alt="Atlas Assessment" className="h-7 sm:h-9 w-auto" />
              </a>
              <span className="hidden sm:inline ml-4 text-sm text-gray-500">
                Career Coach
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-atlas-blue/10 hover:text-atlas-navy hover:border-atlas-blue text-xs sm:text-sm"
            >
              <LayoutDashboard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {showWelcome ? (
        <div className="flex-1 bg-gray-50 overflow-auto">
          {isReturningUser ? (
            <WelcomeBackCard
              onContinue={handleStartSession}
              firstName={profile?.first_name || undefined}
              completedSectionIndex={storedProgressIndex}
            />
          ) : (
            <WelcomeCard
              onReady={handleStartSession}
              isLoading={isInitializing}
            />
          )}
        </div>
      ) : showClosing ? (
        <div className="flex-1 bg-gray-50 overflow-auto">
          <ClosingCard firstName={profile?.first_name || undefined} />
        </div>
      ) : (
        <div className="flex-1 flex relative">
          {/* Chat Area */}
          <div className={`flex-1 flex flex-col bg-gray-50 transition-all ${isSidebarCollapsed ? 'md:mr-12' : 'md:mr-72'}`}>
            {/* Session Restored Banner */}
            {showSessionBanner && (
              <div className="bg-atlas-teal/10 border-b border-atlas-teal/20 px-4 py-2 flex items-center justify-center gap-2 text-sm text-atlas-navy">
                <RefreshCw className="h-4 w-4 text-atlas-teal" />
                <span>Session restored - your coach remembers the conversation</span>
                <button
                  onClick={() => setShowSessionBanner(false)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  x
                </button>
              </div>
            )}

            {/* Custom Chat — replaces n8n widget */}
            {sessionId && user && (
              <ChatContainer
                ref={chatMessagesRef}
                reportId={reportData.id}
                userId={user.id}
                sessionId={sessionId}
                firstName={profile?.first_name || ''}
                country={profile?.country || ''}
                currentSectionIndex={currentSectionIndex}
                onSectionDetected={handleSectionDetected}
                onSessionComplete={() => setShowClosing(true)}
                isSessionCompleted={isSessionCompleted}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            )}
          </div>

          {/* Report Sidebar */}
          <ReportSidebar
            currentSectionIndex={currentSectionIndex}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onSectionClick={handleSectionClick}
            onCompleteSession={() => setShowClosing(true)}
            isSessionCompleted={isSessionCompleted}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;

// ========================================================================
// OLD N8N CHAT CODE (preserved for rollback reference)
//
// The following code was replaced by the custom chat implementation above.
// It used the @n8n/chat widget with MutationObservers for:
// - Auto-expand textarea
// - Voice input (mic button injection)
// - Custom typing indicator
// - HTML tag conversion
// - Section detection
// - Disable input on session complete
//
// The original file is preserved in git history at commit 1f6acc7
// To restore: git checkout 1f6acc7 -- src/pages/Chat.tsx
// ========================================================================
