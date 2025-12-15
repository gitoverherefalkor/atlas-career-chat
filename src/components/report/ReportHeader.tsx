
import React from 'react';

interface ReportHeaderProps {
  latestReport: any;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ latestReport }) => {
  return (
    <div className="mb-8">
      {/* Main Title */}
      <h2 className="text-3xl font-bold text-atlas-navy mb-2">Your Personalized Career Report</h2>

      {/* Assessment Type */}
      {latestReport && (
        <p className="text-lg font-medium text-atlas-teal mb-3">
          Atlas Personality & Career Assessment 2025
        </p>
      )}

      {/* Subtitle */}
      <p className="text-gray-600">
        These insights are adjusted based on feedback provided in the chat where relevant.
      </p>
    </div>
  );
};

export default ReportHeader;
