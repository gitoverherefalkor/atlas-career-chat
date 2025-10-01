import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ReportData = Tables<'reports'>;

const Chat = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      loadUserReport();
    }
  }, [authLoading, user]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-atlas-blue" />
              Your AI Career Coach
            </CardTitle>
            <p className="text-sm text-gray-600">
              Chat with your personalized AI career coach about your assessment results and career path.
            </p>
          </CardHeader>
          <CardContent className="h-full p-0 flex items-center justify-center">
            {/* Relevance AI chat removed. Placeholder below. */}
            <div className="text-center text-gray-500">
              <p>AI chat will be available soon via our new n8n-powered system.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
