
import React from 'react';

interface ReportHeaderProps {
  latestReport: any;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ latestReport }) => {
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        These insights are adjusted based on feedback provided in the chat where relevant.
      </p>
    </div>
  );
};

export default ReportHeader;
