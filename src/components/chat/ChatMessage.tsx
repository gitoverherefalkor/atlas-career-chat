import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { ALL_SECTIONS } from './ReportSidebar';

interface ChatMessageProps {
  content: string;
  sender: 'user' | 'bot';
  onSectionDetected?: (sectionIndex: number) => void;
}

// Convert HTML tags the agent sometimes sends to markdown equivalents
function htmlToMarkdown(text: string): string {
  let result = text;
  // Convert heading tags to markdown
  result = result.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
  result = result.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1');
  result = result.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1');
  // Convert inline tags
  result = result.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  result = result.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  result = result.replace(/<br\s*\/?>/gi, '\n');
  return result;
}

// Check if a heading matches any section in ALL_SECTIONS
function findSectionIndex(headingText: string): number {
  const normalized = headingText.toLowerCase().trim();
  return ALL_SECTIONS.findIndex((section) => {
    if (normalized.includes(section.title.toLowerCase())) return true;
    if (section.altTitles?.some((alt) => normalized.includes(alt.toLowerCase()))) return true;
    if (normalized.includes(section.id.replace(/-/g, ' '))) return true;
    return false;
  });
}

// Custom components for react-markdown to style headings with atlas colors
const markdownComponents = {
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-lg font-bold text-atlas-navy mt-4 mb-2 font-heading"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-base font-semibold text-atlas-blue mt-3 mb-1.5"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5
      className="text-sm font-semibold text-gray-600 mt-2 mb-1"
      {...props}
    >
      {children}
    </h5>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 mb-2 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1" {...props}>
      {children}
    </ol>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  onSectionDetected,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  // After bot message renders, scan for section headings
  useEffect(() => {
    if (sender !== 'bot' || !onSectionDetected || !messageRef.current) return;

    const headings = messageRef.current.querySelectorAll('h3');
    console.log('[Section] DOM scan: found', headings.length, 'h3 elements');
    headings.forEach((h3) => {
      const text = h3.textContent || '';
      console.log('[Section] h3 text:', text);
      const idx = findSectionIndex(text);
      console.log('[Section] findSectionIndex result:', idx, idx >= 0 ? `(${ALL_SECTIONS[idx].title})` : '(no match)');
      if (idx >= 0) {
        onSectionDetected(idx);
        // Add a data attribute so sidebar can scroll to it
        h3.setAttribute('data-section-id', ALL_SECTIONS[idx].id);
      }
    });
  }, [content, sender, onSectionDetected]);

  if (sender === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] bg-atlas-teal text-white rounded-2xl px-4 py-3.5 text-[0.9375rem] leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  // Bot message — render markdown
  const processedContent = htmlToMarkdown(content);
  // Sanitize to be safe
  const sanitized = DOMPurify.sanitize(processedContent);

  return (
    <div className="flex justify-start mb-4">
      <div
        ref={messageRef}
        className="max-w-[85%] bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-[0.9375rem] leading-relaxed text-gray-700"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {sanitized}
        </ReactMarkdown>
      </div>
    </div>
  );
};
