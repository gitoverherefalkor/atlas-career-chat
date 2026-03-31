import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import atlasFigure from '@/logos/Atlas_figure_AA_live.png';

interface WelcomeCardProps {
  onReady: () => void;
  isLoading?: boolean;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ onReady, isLoading = false }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="border-2 border-atlas-blue/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <img src={atlasFigure} alt="Atlas" className="mx-auto mb-4 h-24 w-auto" />
          <CardTitle className="text-2xl font-bold text-atlas-navy">
            Welcome to Your Career Insights Session
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-gray-700 leading-relaxed">
            Welcome! I'll walk you through your personality profile and career recommendations — starting with who you are professionally, then exploring the career paths that best match your goals and strengths.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Feel free to ask questions, push back, or explore any career further along the way.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-atlas-blue mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                No need to take notes — everything lands in a full report on your dashboard. Responses may take a moment as multiple AI tools work in the background.
              </p>
            </div>
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
