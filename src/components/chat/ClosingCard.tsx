import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, FileDown, LayoutDashboard, Info, CheckCircle2 } from 'lucide-react';
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
            Thank you for completing your Atlas Career Assessment!
          </p>

          <p className="text-gray-700 leading-relaxed">
            Your session is complete. All your feedback and insights from our conversation have been securely saved and are being incorporated into your final report.
          </p>

          <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <p className="font-semibold text-green-900">What happens next?</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Your final report will be available in your dashboard shortly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>You'll receive an email notification when it's ready</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>All your feedback and report content is stored securely</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-amber-900">Please note:</p>
                <p className="text-sm text-gray-700">
                  This chat conversation won't be preserved for privacy reasons, but your assessment results and all feedback you provided have been saved and will be reflected in your final report.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Beta disclaimer:</strong> Atlas Career Path Assessment is in beta. Our recommendations are exploratory guidance, not definitive answers. Use this as a reflection tool alongside your experiences and ongoing career exploration.
            </p>
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
