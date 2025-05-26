
import React, { useEffect } from 'react';

const Assessment = () => {
  useEffect(() => {
    // Load the Typeform embed script
    const script = document.createElement('script');
    script.src = '//embed.typeform.com/next/embed.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Atlas Assessment</h1>
            <p className="text-gray-600 mb-6">
              Welcome to your personalized Atlas Assessment. Please complete all sections to receive your career insights.
            </p>
          </div>
          
          {/* Typeform embed */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ minHeight: '600px' }}>
            <div data-tf-live="01JW6HZ1WNV2S9KGHTH4VX16TN"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
