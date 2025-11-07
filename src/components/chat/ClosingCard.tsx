import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, FileDown, LayoutDashboard, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClosingCardProps {
  firstName?: string;
}

export const ClosingCard: React.FC<ClosingCardProps> = ({ firstName }) => {
  const navigate = useNavigate();

  const handleDownloadReport = () => {
    // Navigate to dashboard where the report can be downloaded
    navigate('/dashboard');
  };

  const handleReturnToDashboard = () => {
    // Clear the chat session and return to dashboard
    localStorage.removeItem('n8n-chat/sessionId');
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="border-2 border-green-500/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Award className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-atlas-navy">
            Session Complete{firstName ? `, ${firstName}` : ''}!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            Thanks for taking the time to go through this assessment with me!
          </p>

          <p className="text-gray-700 leading-relaxed">
            Your career isn't a straight line, and that's actually a good thing. The professional world keeps evolving, new roles emerge, industries shift, and your own interests will likely change over time. This assessment gives you a solid foundation to work from, but think of it as a strategic starting point rather than a fixed blueprint.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Use these insights to guide your decisions while staying open to opportunities that align with your strengths, values, and goals. The most valuable skills you can cultivate? Adaptability, curiosity, and a willingness to learn as you go. Your most rewarding career moves might come from unexpected directions.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Stay proactive. Keep developing your skills. Trust yourself to navigate your own path. What matters most is finding work where you can leverage your unique strengths while continuing to grow in ways that feel right for you.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-blue-900">A quick note:</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Atlas Career Path Assessment is still in beta. Our recommendations are designed to be helpful exploratory guidance, not definitive answers. Every career journey is unique, and this represents one informed perspective on your professional potential and personality.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  We encourage you to use this as a reflection tool alongside your own experiences, mentorship, and ongoing exploration.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleDownloadReport}
              size="lg"
              className="bg-gradient-to-r from-atlas-blue to-atlas-teal text-white hover:opacity-90 transition-opacity px-6 py-6 text-base font-semibold"
            >
              <FileDown className="h-5 w-5 mr-2" />
              View Final Report
            </Button>
            <Button
              onClick={handleReturnToDashboard}
              variant="outline"
              size="lg"
              className="border-2 border-atlas-navy text-atlas-navy hover:bg-atlas-navy hover:text-white px-6 py-6 text-base font-semibold"
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
