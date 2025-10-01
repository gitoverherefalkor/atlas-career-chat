import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReportProcessing = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // Start polling for report completion
    const pollInterval = setInterval(checkReportStatus, 30000); // Every 30 seconds

    // Initial check
    checkReportStatus();

    // Update elapsed time every second
    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [authLoading, user]);

  const checkReportStatus = async () => {
    if (!user) return;

    try {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('id, status, title')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (reports && reports.length > 0) {
        // Report is complete!
        toast({
          title: "Report Ready!",
          description: "Your career analysis is complete. Redirecting to chat...",
        });

        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking report status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-atlas-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 animate-ping">
              <Loader2 className="h-16 w-16 text-atlas-blue opacity-20 mx-auto" />
            </div>
            <Loader2 className="h-16 w-16 text-atlas-blue animate-spin mx-auto relative" />
          </div>
          <CardTitle className="text-2xl font-bold text-atlas-navy">
            Analyzing Your Career Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-atlas-blue" />
              <span className="text-lg font-semibold text-atlas-navy">
                Time Elapsed: {formatTime(timeElapsed)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Typical analysis time: 8-10 minutes
            </p>
          </div>

          {/* What's Happening */}
          <div className="space-y-3">
            <h3 className="font-semibold text-atlas-navy flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              What's happening now:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 ml-7">
              <li>• Analyzing your personality traits and work preferences</li>
              <li>• Mapping your skills to career opportunities</li>
              <li>• Generating personalized career recommendations</li>
              <li>• Preparing your AI career coach conversation</li>
            </ul>
          </div>

          {/* Navigation Options */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-amber-900">
                  You can safely navigate away from this page
                </p>
                <p className="text-sm text-amber-700">
                  We'll send you an email when your report is ready, or you can check back here anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={checkReportStatus}
              disabled={isChecking}
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status Now'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportProcessing;
