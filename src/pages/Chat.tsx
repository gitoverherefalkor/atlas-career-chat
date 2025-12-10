import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, MessageSquare, LayoutDashboard } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import '@n8n/chat/style.css';
import '@/styles/n8n-chat.css';
import { createChat } from '@n8n/chat';
import { WelcomeCard } from '@/components/chat/WelcomeCard';
import { WelcomeBackCard } from '@/components/chat/WelcomeBackCard';
import { ClosingCard } from '@/components/chat/ClosingCard';
import { ReportSidebar, ALL_SECTIONS } from '@/components/chat/ReportSidebar';

type ReportData = Tables<'reports'>;

const Chat = () => {
  // Check for existing session immediately to avoid flash
  // n8n stores sessionId under 'n8n-chat/sessionId' key
  const hasExistingSession = localStorage.getItem('n8n-chat/sessionId') !== null;

  // Check if session is stale (older than 72 hours)
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

  console.log('🔍 Session check on init:', {
    hasExistingSession,
    sessionIsStale,
    sessionId: localStorage.getItem('n8n-chat/sessionId')
  });

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showWelcome, setShowWelcome] = useState(!hasExistingSession || sessionIsStale);
  const [showClosing, setShowClosing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1); // -1 = not started
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      loadUserReport();
    }
  }, [authLoading, user]);

  // Auto-initialize chat when returning with existing session (only if not stale)
  useEffect(() => {
    if (reportData && !profileLoading && profile && !chatInitialized && hasExistingSession && !sessionIsStale) {
      console.log('✅ Existing session detected, auto-initializing chat', {
        firstName: profile?.first_name || 'N/A',
        profileLoaded: !profileLoading
      });

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

      // Initialize chat automatically
      initializeChat();
    }
  }, [reportData, profileLoading, chatInitialized, hasExistingSession]);

  const initializeChat = () => {
    if (!reportData) {
      console.error('Cannot initialize chat: reportData is null');
      return;
    }

    const chatWebhookUrl = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL;
    if (!chatWebhookUrl) {
      console.error('Chat webhook URL not configured');
      toast({
        title: "Configuration Error",
        description: "Chat is not properly configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Initializing chat widget', {
      reportId: reportData.id,
      hasSession: hasExistingSession,
      firstName: profile?.first_name || 'N/A'
    });

    setTimeout(() => {
      createChat({
        webhookUrl: chatWebhookUrl,
        mode: 'fullscreen',
        target: '#n8n-chat-container',
        chatSessionKey: 'n8n-chat/sessionId', // Match n8n's actual key
        metadata: {
          report_id: reportData.id,
          first_name: profile?.first_name || '',
          country: profile?.country || '',
        },
        initialMessages: [
          'Chat is ready! 👋',
          'Say hi to get started'
        ],
        i18n: {
          en: {
            title: 'Atlas Career Coach',
            subtitle: 'Discuss your personalized career assessment',
            footer: '',
            getStarted: 'Start Chatting',
            inputPlaceholder: 'Type here',
          },
        },
        showWelcomeScreen: false,
        loadPreviousSession: true,
        enableStreaming: false,
      });

      console.log('✅ Chat initialized, checking localStorage after init:', {
        sessionId: localStorage.getItem('n8n-chat/sessionId')
      });

      setChatInitialized(true);
    }, 500);
  };

  const handleStartSession = () => {
    if (profileLoading || !profile) {
      console.warn('Profile still loading, waiting...');
      toast({
        title: "Loading...",
        description: "Please wait a moment while we load your profile.",
      });
      return;
    }

    console.log('🎯 Starting new session with profile:', {
      firstName: profile?.first_name || 'N/A'
    });

    // Update session timestamp
    localStorage.setItem('n8n-chat/sessionTimestamp', Date.now().toString());

    setIsInitializing(true);
    setShowWelcome(false);
    initializeChat();
    setIsInitializing(false);
  };

  // Determine if this is a returning user with stale/expired session
  const storedProgressIndex = reportData
    ? parseInt(localStorage.getItem(`chat_section_index_${reportData.id}`) || '-1', 10)
    : -1;
  const isReturningUser = sessionIsStale && storedProgressIndex >= 0;

  // Save section progress to localStorage whenever it changes
  useEffect(() => {
    if (reportData && currentSectionIndex >= 0) {
      localStorage.setItem(`chat_section_index_${reportData.id}`, currentSectionIndex.toString());
    }
  }, [currentSectionIndex, reportData]);

  // Store messages in localStorage for session persistence
  const storeMessage = (message: { text: string; sender: 'user' | 'bot'; timestamp: number }) => {
    if (!reportData) return;

    const sessionId = localStorage.getItem('n8n-chat/sessionId');
    if (!sessionId) return;

    const storageKey = `chat_messages_${sessionId}`;
    const existing = localStorage.getItem(storageKey);
    const messages = existing ? JSON.parse(existing) : [];
    messages.push(message);
    localStorage.setItem(storageKey, JSON.stringify(messages));
  };

  // Load and display previous messages
  const loadPreviousMessages = () => {
    const sessionId = localStorage.getItem('n8n-chat/sessionId');
    if (!sessionId) return;

    const storageKey = `chat_messages_${sessionId}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const messages = JSON.parse(stored);
      console.log('📨 Loading previous messages:', messages.length);
      // Messages will be rendered by n8n widget through loadPreviousSession
      return messages;
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  };

  // Watch for new chat messages and detect section headers
  useEffect(() => {
    if (!chatInitialized) return;

    console.log('🔍 Setting up chat section observer...');
    const chatContainer = document.querySelector('#n8n-chat-container');
    if (!chatContainer) {
      console.log('Chat container not found');
      return;
    }

    // Helper to find which section a title matches
    const findSectionIndex = (text: string): number => {
      const lowerText = text.toLowerCase().trim();
      return ALL_SECTIONS.findIndex(section => {
        // Check main title
        if (lowerText.includes(section.title.toLowerCase())) return true;
        // Check alternative titles (what the agent might output)
        if (section.altTitles.some(alt => lowerText.includes(alt))) return true;
        // Check section id
        if (lowerText.includes(section.id.replace(/-/g, ' '))) return true;
        return false;
      });
    };

    // Scan for section headers in a message (only h3 elements from ### markdown)
    const scanForSections = (element: Element) => {
      const messageText = element.textContent?.trim() || '';

      // Check for session completion
      if (messageText.includes('SESSION_COMPLETE')) {
        console.log('🏁 Session completion detected');
        setShowClosing(true);
        return;
      }

      // Only look for h3 elements (rendered from ### markdown)
      const h3Elements = element.querySelectorAll('h3');

      h3Elements.forEach((h3) => {
        const title = h3.textContent?.trim();
        if (!title) return;

        const sectionIndex = findSectionIndex(title);
        if (sectionIndex >= 0) {
          console.log(`📍 Section detected: "${title}" → index ${sectionIndex} (${ALL_SECTIONS[sectionIndex].title})`);
          setCurrentSectionIndex(prev => Math.max(prev, sectionIndex));
        }
      });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const element = node as Element;

          // Check bot messages
          if (element.classList.contains('chat-message-from-bot') ||
              element.querySelector('.chat-message-from-bot')) {
            const messages = element.classList.contains('chat-message-from-bot')
              ? [element]
              : Array.from(element.querySelectorAll('.chat-message-from-bot'));

            messages.forEach(scanForSections);
          }

          // Also scan any chat-message element
          if (element.classList.contains('chat-message')) {
            scanForSections(element);
          }
        });
      });
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    console.log('✅ Section observer attached');

    // Initial scan of existing messages
    setTimeout(() => {
      const existingMessages = chatContainer.querySelectorAll('.chat-message-from-bot, .chat-message-markdown');
      console.log(`📖 Scanning ${existingMessages.length} existing messages for sections`);
      existingMessages.forEach(scanForSections);
    }, 1500);

    return () => observer.disconnect();
  }, [chatInitialized]);

  const handleSectionClick = (sectionId: string, index: number) => {
    // Find the section from ALL_SECTIONS
    const section = ALL_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;

    console.log('🔗 Clicking section:', section.title);

    // Build list of terms to search for
    const searchTerms = [
      section.title.toLowerCase(),
      ...section.altTitles,
      sectionId.replace(/-/g, ' ')
    ];

    // First try to find h3 elements directly (most accurate)
    const allH3s = document.querySelectorAll('#n8n-chat-container h3');
    for (const h3 of allH3s) {
      const h3Text = h3.textContent?.toLowerCase() || '';

      // Match against any of the search terms
      if (searchTerms.some(term => h3Text.includes(term))) {
        console.log('✅ Found h3:', h3Text);
        h3.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Fallback: search through bot messages
    const messages = document.querySelectorAll('.chat-message-from-bot');
    for (const message of messages) {
      const text = message.textContent?.toLowerCase() || '';

      if (searchTerms.some(term => text.includes(term))) {
        console.log('✅ Found in message text');
        message.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  };


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
      {/* Clean Header - Homepage Style */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container-atlas">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-atlas-blue to-atlas-navy bg-clip-text text-transparent font-heading">
                  Atlas Assessment
                </span>
              </a>
              <span className="ml-4 text-sm text-gray-500">
                Career Coach
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-atlas-blue/10 hover:text-atlas-navy hover:border-atlas-blue"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
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
          {/* Chat Area - scrollable, with right margin for fixed sidebar */}
          <div className={`flex-1 flex flex-col bg-gray-50 overflow-y-auto transition-all ${isSidebarCollapsed ? 'mr-12' : 'mr-72'}`}>
            <div id="n8n-chat-container" className="flex-1"></div>
          </div>

          {/* Report Sidebar - fixed position */}
          <ReportSidebar
            currentSectionIndex={currentSectionIndex}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onSectionClick={handleSectionClick}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
