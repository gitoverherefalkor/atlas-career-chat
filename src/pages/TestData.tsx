
import React from 'react';
import { MockDataSubmitter } from '@/components/survey/MockDataSubmitter';

const TestData = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-center mb-8">Survey Test Data</h1>
        <MockDataSubmitter />
      </div>
    </div>
  );
};

export default TestData;
