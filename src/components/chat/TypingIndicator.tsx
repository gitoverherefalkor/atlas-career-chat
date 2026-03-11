import React, { useState, useEffect } from 'react';

// Phase-aware status messages that rotate while waiting for AI response
const getStatusMessages = (sectionIndex: number): string[] => {
  if (sectionIndex >= 4) {
    return [
      'Querying career database',
      'Analyzing career compatibility',
      'Matching role profiles',
      'Processing recommendations',
      'Preparing career insights',
    ];
  }
  return [
    'Retrieving profile data',
    'Parsing assessment results',
    'Analyzing personality insights',
    'Preparing your section',
    'Processing your input',
  ];
};

interface TypingIndicatorProps {
  currentSectionIndex: number;
  isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  currentSectionIndex,
  isVisible,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = getStatusMessages(currentSectionIndex);

  // Rotate messages every 3 seconds
  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2.5 py-2 px-1 max-w-[280px]">
      {/* Animated bars */}
      <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
        <span className="block w-[3px] bg-atlas-teal rounded-sm h-1.5 animate-bar-pulse" />
        <span className="block w-[3px] bg-atlas-teal rounded-sm h-2.5 animate-bar-pulse [animation-delay:0.15s]" />
        <span className="block w-[3px] bg-atlas-teal rounded-sm h-3.5 animate-bar-pulse [animation-delay:0.3s]" />
        <span className="block w-[3px] bg-atlas-teal rounded-sm h-2 animate-bar-pulse [animation-delay:0.45s]" />
      </div>
      {/* Rotating status text */}
      <span className="text-[0.8125rem] text-gray-500 italic animate-text-fade">
        {messages[messageIndex]}
      </span>
    </div>
  );
};
