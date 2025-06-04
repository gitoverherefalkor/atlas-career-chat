import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ReportData = Tables<'reports'>;

const Chat = () => {
  const [searchParams] = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const userId = searchParams.get('user_id');

  useEffect(() => {
    validateAccess();
  }, [token, userId]);

  const validateAccess = async () => {
    if (!token || !userId) {
      toast({
        title: "Invalid Access",
        description: "Missing required parameters for chat access.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    try {
      // For now, let's validate using the report ID as token and relevance_user_id
      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', token)
        .eq('relevance_user_id', userId)
        .single();

      if (error || !report) {
        toast({
          title: "Invalid Access",
          description: "This chat link is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setReportData(report);
      setIsValid(true);
    } catch (error) {
      console.error('Error validating chat access:', error);
      toast({
        title: "Access Error",
        description: "Unable to validate chat access. Please try again.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-atlas-blue" />
          <p className="text-gray-600">Validating chat access...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <MessageSquare className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              This chat session is not valid or has expired.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
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
                Report ID: {reportData?.id?.slice(0, 8)}...
              </span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
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
          <CardContent className="h-full p-0">
            <iframe 
              src={`https://app.relevanceai.com/agents/d7b62b/cd9443294731-442f-ac7b-9abdfdd30fae/d1f599a9-1a50-4a3a-ba93-ebe1be45a105/embed-chat?hide_tool_steps=true&hide_file_uploads=true&hide_conversation_list=true&bubble_style=agent&primary_color=%234b7bb9&bubble_icon=pd%2Fchat&input_placeholder_text=To+send+a+message%2C+click+the+arrow+or+cmd%2Benter+%28cntl+on+Windows%29&hide_logo=true&hide_description=false&user_id=${userId}`}
              width="100%" 
              height="100%" 
              frameBorder="0"
              className="rounded-lg"
              title="Atlas Career Coach Chat"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
