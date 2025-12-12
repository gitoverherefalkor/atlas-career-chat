
import React from 'react';

interface ReportHeaderProps {
  latestReport: any;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ latestReport }) => {
  return (
    <div className="text-left mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personalized Career Report</h2>
      <p className="text-sm text-gray-600 mb-4">
        <em>These insights are adjusted based on feedback provided in the chat where relevant.</em>
      </p>
      
      {/* Assessment Title */}
      {latestReport && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-atlas-teal">
            Atlas Personality & Career Assessment 2025 [Office / Business Professional]
          </h4>
        </div>
      )}
    </div>
  );
};

export default ReportHeader;
