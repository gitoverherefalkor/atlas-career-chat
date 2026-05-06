
import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExecSummaryModalProps {
  content: string;
  onClose: () => void;
  onViewReport: () => void;
}

// Parse inline HTML (<strong>, <em>) into React elements
function renderInlineHtml(text: string): React.ReactNode {
  const parts = text.split(/(<strong>.*?<\/strong>|<em>.*?<\/em>|<b>.*?<\/b>|<i>.*?<\/i>)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    const strongMatch = part.match(/^<(?:strong|b)>(.*?)<\/(?:strong|b)>$/);
    if (strongMatch) return <strong key={i} className="font-semibold">{strongMatch[1]}</strong>;
    const emMatch = part.match(/^<(?:em|i)>(.*?)<\/(?:em|i)>$/);
    if (emMatch) return <em key={i}>{emMatch[1]}</em>;
    return part;
  });
}

// Render exec summary content — handles <h5>, <strong>, and plain paragraphs
function renderExecContent(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  content.split('\n').forEach((line, index) => {
    const trimmed = line.trim();

    // Skip empty lines (add spacing)
    if (!trimmed) {
      return;
    }

    // HTML h5 heading
    const h5Match = trimmed.match(/^<h5>(?:<strong>)?(.*?)(?:<\/strong>)?<\/h5>$/);
    if (h5Match) {
      elements.push(
        <h3 key={index} className="text-lg font-bold text-atlas-teal mt-6 mb-2 first:mt-0">
          {h5Match[1]}
        </h3>
      );
      return;
    }

    // Regular paragraph with inline HTML support
    elements.push(
      <p key={index} className="mb-3 last:mb-0">
        {renderInlineHtml(trimmed)}
      </p>
    );
  });

  return elements;
}

export const ExecSummaryModal: React.FC<ExecSummaryModalProps> = ({
  content,
  onClose,
  onViewReport,
}) => {
  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll while the modal is open so the dashboard underneath
  // can't drift when the user scrolls inside the modal. Same pattern as
  // CareerSignatureModal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — click to dismiss */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* No floating close X — the footer already has a Close link
            and Esc / backdrop click also dismiss, so an extra X would
            be redundant. */}

        {/* Light-teal header — matches the WrapUpCard tinted-header pattern
            so the "intro to a section" feel is consistent across the app. */}
        <div className="bg-atlas-teal/5 px-8 pt-7 pb-5 border-b border-atlas-teal/15">
          <h2 className="text-2xl font-bold text-atlas-navy font-heading">Your Executive Summary</h2>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            A snapshot of your career profile and direction.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="text-gray-700 leading-relaxed text-[15px]">
            {renderExecContent(content)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
            <Button
              onClick={onViewReport}
              className="bg-atlas-teal hover:bg-atlas-teal/90"
            >
              Explore Your Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
