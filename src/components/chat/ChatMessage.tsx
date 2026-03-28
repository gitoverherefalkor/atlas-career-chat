import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { ChevronDown } from 'lucide-react';
import { ALL_SECTIONS } from './ReportSidebar';

interface ChatMessageProps {
  content: string;
  sender: 'user' | 'bot';
  onSectionDetected?: (sectionIndex: number) => void;
  onAllBlocksOpened?: () => void;
  defaultAllCollapsed?: boolean;
}

interface CareerBlock {
  title: string;  // The ### heading text (bold markers stripped)
  body: string;   // Everything after the heading line
}

interface SplitContent {
  intro: string;
  blocks: CareerBlock[];
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

// Split a message into an intro + career blocks, based on ### headings.
// Only meaningful when a message contains 2+ ### sections (e.g. runner_ups,
// outside_box, dream_jobs). Single-### messages are returned as-is.
function splitIntoCareerBlocks(markdown: string): SplitContent {
  const parts = markdown.split(/(?=^### )/m);
  // Strip trailing horizontal rule from intro (SOP wraps content in ---)
  const intro = (parts[0] || '').replace(/\n?\s*---\s*$/, '').trim();

  const blocks: CareerBlock[] = parts.slice(1).map((block) => {
    const firstNewline = block.indexOf('\n');
    const titleLine = firstNewline >= 0 ? block.slice(0, firstNewline) : block;

    // Clean title: strip ### prefix and any ** bold markers
    const title = titleLine
      .replace(/^###\s*/, '')
      .replace(/\*\*/g, '')
      .trim();

    const rawBody = firstNewline >= 0 ? block.slice(firstNewline + 1) : '';
    // Strip decorative --- separators at start/end of each block
    const body = rawBody
      .replace(/^\s*---\s*\n?/, '')
      .replace(/\n?\s*---\s*$/, '')
      .trim();

    return { title, body };
  });

  return { intro, blocks };
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

// Renders a multi-career message as collapsible blocks.
// By default first career is open; when defaultAllCollapsed=true, all start closed.
// When onAllBlocksOpened is provided, fires once every block has been opened at least once.
const CollapsibleCareerBlocks: React.FC<{
  intro: string;
  blocks: CareerBlock[];
  defaultAllCollapsed?: boolean;
  onAllBlocksOpened?: () => void;
}> = ({
  intro,
  blocks,
  defaultAllCollapsed = false,
  onAllBlocksOpened,
}) => {
  // Sub-blocks = everything after the first (title) block.
  // The title block is always visible, so only sub-blocks are collapsible.
  const subBlocks = blocks.slice(1);

  const [openIndices, setOpenIndices] = useState<Set<number>>(
    new Set(defaultAllCollapsed ? [] : [0])
  );
  // Track which sub-blocks have EVER been opened (for the "all read" signal)
  const [everOpened, setEverOpened] = useState<Set<number>>(
    new Set(defaultAllCollapsed ? [] : [0])
  );
  const firedRef = useRef(false);

  const toggle = (idx: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

    // Track that this sub-block was opened at least once
    setEverOpened((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      // Check if all sub-blocks have now been opened at least once
      if (next.size >= subBlocks.length && !firedRef.current && onAllBlocksOpened) {
        firedRef.current = true;
        onAllBlocksOpened();
      }
      return next;
    });
  };

  // First block is the career title + intro — always expanded, never collapsible.
  // Remaining blocks (subBlocks) are sub-sections — collapsible.
  const titleBlock = blocks[0];

  return (
    <div>
      {/* Intro text — always visible */}
      {intro && (
        <div className="mb-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {intro}
          </ReactMarkdown>
        </div>
      )}

      {/* Career title block — always expanded, no chevron */}
      {titleBlock && (
        <div className="mb-3">
          <h3 className="text-lg font-bold text-atlas-navy font-heading mt-4 mb-2">
            {titleBlock.title}
          </h3>
          {titleBlock.body && (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {titleBlock.body}
            </ReactMarkdown>
          )}
        </div>
      )}

      {/* Sub-section blocks — collapsible */}
      {subBlocks.length > 0 && (
        <div className="flex flex-col gap-2">
          {subBlocks.map((block, idx) => {
            const isOpen = openIndices.has(idx);
            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Clickable header — always visible */}
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  {/* h3 so DOM section-detection still works */}
                  <h3 className="text-base font-bold text-atlas-navy font-heading m-0 leading-snug">
                    {block.title}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 ml-3 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Collapsible body */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 text-[0.9375rem]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {block.body}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  onSectionDetected,
  onAllBlocksOpened,
  defaultAllCollapsed = false,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  // After bot message renders, scan for section headings in the DOM
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

  // Bot message — convert any HTML tags to markdown, then sanitize
  const processedContent = htmlToMarkdown(content);
  const sanitized = DOMPurify.sanitize(processedContent);

  // Check if this message has multiple career blocks worth collapsing
  const { intro, blocks } = splitIntoCareerBlocks(sanitized);
  const hasMultipleBlocks = blocks.length >= 2;

  return (
    <div className="flex justify-start mb-4">
      <div
        ref={messageRef}
        className="max-w-[85%] bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-[0.9375rem] leading-relaxed text-gray-700"
      >
        {hasMultipleBlocks ? (
          <CollapsibleCareerBlocks
            intro={intro}
            blocks={blocks}
            defaultAllCollapsed={defaultAllCollapsed}
            onAllBlocksOpened={onAllBlocksOpened}
          />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {sanitized}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};
