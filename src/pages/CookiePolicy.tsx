import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
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
        <h1 className="text-4xl font-bold text-atlas-navy mb-6">Cookie Policy</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <p className="text-gray-600 leading-relaxed">
            This is a placeholder for the Cookie Policy. Content will be updated soon with detailed information about how Atlas Assessment uses cookies, what types of cookies we use, and how users can manage their cookie preferences.
          </p>

          <p className="text-gray-600 leading-relaxed">
            We are committed to transparency about data collection and usage. Our cookie policy will explain in detail how we use essential cookies for site functionality, analytics cookies to improve user experience, and any third-party cookies that may be present on our platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
