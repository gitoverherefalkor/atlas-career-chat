import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [revealedSections, setRevealedSections] = useState<RevealedSection[]>([]);
  const [currentSection, setCurrentSection] = useState<string | undefined>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      loadUserReport();
    }
  }, [authLoading, user]);

  // Watch for new chat messages and detect section headers
  useEffect(() => {
    if (!chatInitialized) return;

    const chatContainer = document.querySelector('#n8n-chat-container');
    if (!chatContainer) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Look for bot messages
            const botMessages = element.querySelectorAll('.chat-message-from-bot');
            botMessages.forEach((message) => {
              const text = message.textContent || '';

              // Parse section headers (e.g., "## Executive Summary", "Executive Summary:")
              const sectionPatterns = [
                /^##\s*(.+?)(?::|$)/m,  // Markdown headers
                /^(.+?):/m,              // Plain text with colon
              ];

              for (const pattern of sectionPatterns) {
                const match = text.match(pattern);
                if (match) {
                  const title = match[1].trim();
                  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                  // Add section if not already revealed
                  setRevealedSections(prev => {
                    if (prev.find(s => s.id === id)) return prev;
                    return [...prev, { id, title }];
                  });

                  setCurrentSection(id);
                  break;
                }
              }
            });
          }
        });
      });
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

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

  const handleStartSession = async () => {
    if (!reportData) return;

    setIsInitializing(true);

    try {
      // Hide welcome card and initialize chat
      setShowWelcome(false);

      // Initialize n8n chat widget with report_id in metadata
      setTimeout(() => {
        const chatWebhookUrl = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL;

        if (!chatWebhookUrl) {
          console.error('Chat webhook URL not configured');
          toast({
            title: "Configuration Error",
            description: "Chat is not properly configured. Please contact support.",
            variant: "destructive",
          });
          setIsInitializing(false);
          return;
        }

        createChat({
          webhookUrl: chatWebhookUrl,
          mode: 'fullscreen',
          target: '#n8n-chat-container',
          metadata: {
            report_id: reportData.id,
          },
          initialMessages: [
            'Chat is ready! 👋',
            'Say hi to get started and I\'ll walk you through your Executive Summary and career insights.'
          ],
          i18n: {
            en: {
              title: 'Atlas Career Coach',
              subtitle: 'Discuss your personalized career assessment',
              footer: '',
              getStarted: 'Start Chatting',
              inputPlaceholder: 'Type "hi" to begin...',
            },
          },
          showWelcomeScreen: false,
          loadPreviousSession: false,
          enableStreaming: false,
        });

        setChatInitialized(true);
        setIsInitializing(false);
      }, 500);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to start your career coaching session. Please try again.",
        variant: "destructive",
      });
      setIsInitializing(false);
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
