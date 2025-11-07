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
import { ReportSidebar } from '@/components/chat/ReportSidebar';

type ReportData = Tables<'reports'>;

interface RevealedSection {
  id: string;
  title: string;
}

const Chat = () => {
  // Check for existing session immediately to avoid flash
  // n8n stores sessionId under 'n8n-chat/sessionId' key
  const hasExistingSession = localStorage.getItem('n8n-chat/sessionId') !== null;
  console.log('🔍 Session check on init:', {
    hasExistingSession,
    sessionId: localStorage.getItem('n8n-chat/sessionId')
  });

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showWelcome, setShowWelcome] = useState(!hasExistingSession);
  const [isInitializing, setIsInitializing] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [revealedSections, setRevealedSections] = useState<RevealedSection[]>([]);
  const [currentSection, setCurrentSection] = useState<string | undefined>();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      loadUserReport();
    }
  }, [authLoading, user]);

  // Auto-initialize chat when returning with existing session
  useEffect(() => {
    if (reportData && !profileLoading && profile && !chatInitialized && hasExistingSession) {
      console.log('✅ Existing session detected, auto-initializing chat', {
        firstName: profile?.first_name || 'N/A',
        profileLoaded: !profileLoading
      });

      // Restore revealed sections
      const storedSections = localStorage.getItem(`chat_sections_${reportData.id}`);
      if (storedSections) {
        try {
          const sections = JSON.parse(storedSections);
          setRevealedSections(sections);
        } catch (e) {
          console.error('Failed to restore sections:', e);
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

    setIsInitializing(true);
    setShowWelcome(false);
    initializeChat();
    setIsInitializing(false);
  };

  // Save revealed sections to localStorage whenever they change
  useEffect(() => {
    if (reportData && revealedSections.length > 0) {
      localStorage.setItem(`chat_sections_${reportData.id}`, JSON.stringify(revealedSections));
    }
  }, [revealedSections, reportData]);

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

    console.log('Setting up chat observer...');
    const chatContainer = document.querySelector('#n8n-chat-container');
    if (!chatContainer) {
      console.log('Chat container not found');
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            console.log('New element added:', element);

            // Store messages for persistence
            if (element.classList.contains('chat-message')) {
              const isUser = element.classList.contains('chat-message-from-user');
              const text = element.textContent?.trim() || '';
              if (text && !element.classList.contains('chat-message-typing')) {
                storeMessage({
                  text,
                  sender: isUser ? 'user' : 'bot',
                  timestamp: Date.now()
                });
              }
            }

            // Try multiple selectors for bot messages
            const selectors = [
              '.chat-message-from-bot',
              '.chat-message.bot',
              '.message-bot',
              '[data-role="bot"]',
              '.chat-message'
            ];

            let botMessages: Element[] = [];
            for (const selector of selectors) {
              const found = element.querySelectorAll(selector);
              if (found.length > 0) {
                console.log(`Found ${found.length} messages with selector: ${selector}`);
                botMessages = Array.from(found);
                break;
              }
            }

            // Also check if the element itself is a message
            if (element.classList.contains('chat-message') || element.textContent) {
              botMessages.push(element);
            }

            botMessages.forEach((message) => {
              // Look for <h3> elements (rendered from ### markdown)
              const h3Elements = message.querySelectorAll('h3');

              console.log(`Found ${h3Elements.length} h3 elements in message`);

              h3Elements.forEach((h3) => {
                const title = h3.textContent?.trim();
                if (!title) return;

                const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                console.log('Found section header:', { title, id });

                // Add section if not already revealed
                setRevealedSections(prev => {
                  if (prev.find(s => s.id === id)) return prev;
                  console.log('Adding new section to sidebar:', title);
                  return [...prev, { id, title }];
                });

                setCurrentSection(id);
              });
            });
          }
        });
      });
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    console.log('Observer attached to chat container');

    // Initial scan of existing messages (for loaded previous session)
    setTimeout(() => {
      // Load and inject previous messages if they exist
      const previousMessages = loadPreviousMessages();
      if (previousMessages && previousMessages.length > 0) {
        console.log(`📨 Injecting ${previousMessages.length} stored messages`);
        // Note: This is a simplified approach - messages are already stored by n8n
        // The real persistence comes from n8n's Memory node
      }

      const existingMessages = chatContainer.querySelectorAll('.chat-message-from-bot, .chat-message');
      console.log(`Scanning ${existingMessages.length} existing messages for sections`);

      existingMessages.forEach((message) => {
        const h3Elements = message.querySelectorAll('h3');
        h3Elements.forEach((h3) => {
          const title = h3.textContent?.trim();
          if (!title) return;

          const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          console.log('Found section in loaded history:', { title, id });

          setRevealedSections(prev => {
            if (prev.find(s => s.id === id)) return prev;
            return [...prev, { id, title }];
          });
        });
      });
    }, 1000); // Wait for messages to render

    return () => observer.disconnect();
  }, [chatInitialized]);

  const handleSectionClick = (sectionId: string) => {
    // Find the message containing this section
    const messages = document.querySelectorAll('.chat-message-from-bot');
    for (const message of messages) {
      const text = message.textContent || '';
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (id.includes(sectionId) || text.toLowerCase().includes(sectionId.replace(/-/g, ' '))) {
        message.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentSection(sectionId);
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
          <WelcomeCard
            onReady={handleStartSession}
            isLoading={isInitializing}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            <div id="n8n-chat-container" className="flex-1"></div>
          </div>

          {/* Report Sidebar */}
          <ReportSidebar
            revealedSections={revealedSections}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onSectionClick={handleSectionClick}
            currentSection={currentSection}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
