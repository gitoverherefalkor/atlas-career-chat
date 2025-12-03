import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface WelcomeCardProps {
  onReady: () => void;
  isLoading?: boolean;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ onReady, isLoading = false }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="border-2 border-atlas-blue/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-atlas-blue to-atlas-teal rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-atlas-navy">
            Welcome to Your Career Insights Session
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-gray-700 leading-relaxed">
            Hi, and great to have you here! Welcome to your career insights session. My goal is to walk you through your personality profile and career recommendations in a way that's clear, engaging, and actionable.
          </p>

          <p className="text-gray-700 leading-relaxed">
            This conversation is designed to help you understand your professional strengths, potential blind spots, and the career paths that best align with your goals.
          </p>

          <div className="bg-blue-50 border-l-4 border-atlas-blue p-5 rounded-r-lg">
            <p className="text-atlas-navy mb-3 font-medium">Here's how this will work:</p>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-atlas-navy mt-0.5">1.</span>
                <span>We'll start with a quick Executive Summary.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-atlas-navy mt-0.5">2.</span>
                <span>Then do a deeper dive into your Personality Insights, exploring what drives you, how you work best, and key takeaways that shape your career direction.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-atlas-navy mt-0.5">3.</span>
                <div>
                  <span>Then, we'll move on to your Career matches:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Top 3 best fits</li>
                    <li>• Suitable Runner-up suggestions</li>
                    <li>• Some Outside-the-box careers you might not have considered</li>
                    <li>• And an assessment on your Dream job(s) you provided</li>
                  </ul>
                </div>
              </li>
            </ol>
          </div>

          <p className="text-gray-700 leading-relaxed">
            Feel free to ask anything along the way, whether it's clarification, exploring a career further, or sharing feedback on your results.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-atlas-blue mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">
                No need to take notes — you'll receive a full report with all the details and your feedback at the end of this session in your dashboard.
              </p>
            </div>
            <p className="text-gray-600 pl-8">
              I'm doing a lot of 'thinking' and directing different AI tools in the background so sometimes I might take a little longer to get back to you. Thanks for your patience!
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <Button
              onClick={onReady}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-atlas-blue to-atlas-teal text-white hover:opacity-90 transition-opacity px-8 py-6 text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Preparing your session...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  I'm Ready!
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
