import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import '@n8n/chat/style.css';
import '@/styles/n8n-chat.css';
import { createChat } from '@n8n/chat';

type ReportData = Tables<'reports'>;

const Chat = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [chatInitialized, setChatInitialized] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      loadUserReport();
    }
  }, [authLoading, user]);

  // Initialize n8n chat when report is loaded
  useEffect(() => {
    if (reportData && !chatInitialized) {
      const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

      if (!n8nWebhookUrl) {
        console.error('N8N webhook URL not configured');
        toast({
          title: "Configuration Error",
          description: "Chat is not properly configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      createChat({
        webhookUrl: n8nWebhookUrl,
        mode: 'fullscreen',
        target: '#n8n-chat-container',
        metadata: {
          report_id: reportData.id,
        },
        initialMessages: [
          'Hi there! 👋',
          'I\'m your AI career coach. I\'ve reviewed your assessment and I\'m here to discuss your results and answer any questions about your career path.',
        ],
        i18n: {
          en: {
            title: 'Atlas Career Coach',
            subtitle: 'Discuss your personalized career assessment',
            footer: '',
            getStarted: 'Start Conversation',
            inputPlaceholder: 'Ask me about your results...',
          },
        },
        showWelcomeScreen: false,
        loadPreviousSession: true,
        enableStreaming: true,
      });

      setChatInitialized(true);
    }
  }, [reportData, chatInitialized, toast]);

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
        .eq('status', 'completed')
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-atlas-navy">Atlas Career Coach</h1>
              <span className="ml-4 text-sm text-gray-500">
                {reportData.title}
              </span>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="mx-auto" style={{ height: 'calc(100vh - 64px)' }}>
        <div id="n8n-chat-container" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
};

export default Chat;
