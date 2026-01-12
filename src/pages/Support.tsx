import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-atlas-navy mb-6">Support</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <p className="text-gray-600 leading-relaxed">
            This is a placeholder for the Support page. Content will be updated soon with comprehensive support resources including FAQs, troubleshooting guides, and contact information for technical assistance.
          </p>

          <p className="text-gray-600 leading-relaxed">
            We're here to help you get the most out of your Atlas Assessment experience. Our support resources will cover common questions about the assessment process, account management, report interpretation, and technical issues. If you need immediate assistance, please reach out to our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Support;
