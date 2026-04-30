import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { ChevronDown, Pencil } from 'lucide-react';
import { ALL_SECTIONS } from './ReportSidebar';
import type { ReportSection } from '@/hooks/useReportSections';
import { CareerScoreCard, extractAIImpact } from './CareerScoreCard';
import { iconForSubsection } from './subsectionIcons';

interface ChatMessageProps {
  content: string;
  sender: 'user' | 'bot';
  onSectionDetected?: (sectionIndex: number) => void;
  onAllBlocksOpened?: () => void;
  defaultAllCollapsed?: boolean;
  // Career sections from the user's report. Used to lookup match scores
  // for headings that appear inside this message.
  sections?: ReportSection[];
  // True only for the most recent bot message. When true, big section-reveal
  // messages (multiple ## sub-headers) get a sequential reveal pattern
  // instead of dumping all the text at once. Historical messages render flat.
  isLatestBotMessage?: boolean;
  // Used by 'follow-up with options' messages — clicking an option chip
  // sends it back as a user message (or focuses input for free-text).
  onChipSend?: (message: string) => void;
  onChipFocusInput?: (placeholder?: string) => void;
  // Forwarded to SequentialSubsections so the parent can lock the chat
  // input + quick replies until all sub-sections have been revealed.
  onSequentialRevealStateChange?: (revealed: number, total: number) => void;
}

interface ChipOption {
  display: string;  // What's shown in the chip
  message: string;  // What's sent if the chip is clicked
  isFreeText: boolean; // true → focus input instead of sending
}

// Detect if a bot message is a 'follow-up with options' — i.e. an intro
// line + a bullet list of bold-leading items. These appear when the user
// clicks 'Explore more' or 'I see this differently' and the bot offers
// specific topics to dig into. We render the bullets as clickable chips
// (Claude-style multiple choice) instead of a plain bullet list, so the
// user can click to drill in (or use the 'Something else' chip / type
// freely) without facing the same generic Quick Replies again.
function detectFollowUpOptions(markdown: string): {
  intro: string;
  options: ChipOption[];
} | null {
  // Section reveals always have a ### title — those aren't follow-ups.
  if (/^### /m.test(markdown)) return null;

  const lines = markdown.split('\n');
  // Bullets with a bold lead like "- **Title** - description" or "- **All bold!**"
  const bulletRegex = /^\s*-\s*\*\*(.+?)\*\*\s*(.*)$/;

  const introLines: string[] = [];
  const options: ChipOption[] = [];
  let seenBullet = false;

  for (const line of lines) {
    const m = line.match(bulletRegex);
    if (m) {
      seenBullet = true;
      const title = m[1].trim().replace(/[!?.]+$/, '');
      // "- description" → strip leading dash; otherwise plain text.
      const rawDesc = (m[2] || '').replace(/^\s*-\s*/, '').trim();
      const display = rawDesc ? `${title} — ${rawDesc}` : title;
      const isFreeText = /something else|let me know/i.test(`${title} ${rawDesc}`);
      options.push({ display, message: title, isFreeText });
    } else if (!seenBullet && line.trim()) {
      introLines.push(line);
    }
  }

  if (options.length < 2) return null;
  return { intro: introLines.join('\n').trim(), options };
}

// Section types that have a meaningful score column we want to surface.
const SCORED_SECTION_TYPES = new Set([
  'top_career_1',
  'top_career_2',
  'top_career_3',
  'runner_ups',
  'outside_box',
]);

// Strip basic HTML tags + bold markers from a heading-style string and lowercase it.
function normalizeTitle(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Match a chat heading text against the report_sections.title field.
// Heading shape: "Chief People Officer". DB title shape:
// "<h3><strong>Chief People Officer</strong></h3>". We compare normalized forms.
function findSectionByTitle(
  sections: ReportSection[] | undefined,
  headingText: string
): ReportSection | null {
  if (!sections || sections.length === 0) return null;
  const norm = normalizeTitle(headingText);
  if (!norm) return null;

  for (const s of sections) {
    if (!SCORED_SECTION_TYPES.has(s.section_type)) continue;
    if (!s.title) continue;
    const sectionTitle = normalizeTitle(s.title);
    if (!sectionTitle) continue;
    if (sectionTitle === norm) return s;
    if (norm.includes(sectionTitle) || sectionTitle.includes(norm)) return s;
  }
  return null;
}

interface CareerBlock {
  title: string;  // The ### heading text (bold markers stripped)
  body: string;   // Everything after the heading line
}

interface SplitContent {
  intro: string;
  blocks: CareerBlock[];
}

// Convert HTML tags the agent sometimes sends to markdown equivalents.
// The agent's actual output convention (verified from live content):
//   ### Section Title         (h3 — main section heading)
//   ##### Sub-Header          (h5 — teal sub-headers inside sections)
// We mirror that convention when converting from HTML so the splitter
// downstream finds the right boundaries. Newlines around each heading
// ensure they land on their own line for ^# regex matching.
function htmlToMarkdown(text: string): string {
  let result = text;
  result = result.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n### $1\n');
  result = result.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n### $1\n');
  result = result.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  result = result.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n##### $1\n');
  result = result.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
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

interface H2Subsection {
  title: string;
  body: string;
}

// Split a section-reveal message into a preamble (### section title + intro)
// plus an array of ##### sub-sections. Powers the sequential reveal so the
// user sees one sub-section at a time.
//
// Agent's actual format (verified from production content):
//   ### Section Title
//   intro paragraph
//   ##### Sub-Header One
//   body
//   ##### Sub-Header Two
//   body
function splitIntoH2Subsections(markdown: string): {
  preamble: string;
  subsections: H2Subsection[];
} {
  const parts = markdown.split(/(?=^##### )/m);
  const preamble = (parts[0] || '').trim();
  const subsections = parts.slice(1).map((part) => {
    const firstNewline = part.indexOf('\n');
    const titleLine = firstNewline >= 0 ? part.slice(0, firstNewline) : part;
    const title = titleLine
      .replace(/^#####\s*/, '')
      .replace(/\*\*/g, '')
      .trim();
    const body = firstNewline >= 0 ? part.slice(firstNewline + 1).trim() : '';
    return { title, body };
  });
  return { preamble, subsections };
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

// Custom components for react-markdown to style headings with atlas colors.
// The agent emits a mix of heading levels (## for sub-sections like
// "Personality and Interaction Style", ### for main section titles, etc.),
// so we style every level rather than only the ones we expect.
const markdownComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-lg font-semibold text-atlas-teal mt-6 mb-2 first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    // scroll-mt-[120px] ensures the sticky page navbar (~73px) doesn't
    // cover the heading when the user clicks a sidebar section to scroll
    // here. ~50px of breathing room below the navbar feels intentional.
    <h3
      className="text-xl font-bold text-atlas-navy mt-8 mb-2 font-heading first:mt-0 scroll-mt-[120px]"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-lg font-semibold text-atlas-blue mt-6 mb-2 first:mt-0"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    // The agent uses ##### for the teal sub-headers inside section reveals
    // ('Personality and Interaction Style', 'Your Conflict Style', etc).
    // This is what users actually see — give it the prominent styling.
    <h5
      className="text-lg font-semibold text-atlas-teal mt-6 mb-2 first:mt-0"
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

// Renders a section-reveal message with sequential sub-section disclosure.
// Initial render: preamble (h3 + intro) + first h2 sub-section + a chevron
// that previews the NAME of the next sub-section. Click → next reveals,
// chevron updates to the one after. Repeat until all are visible.
//
// Once revealed, sub-sections stay visible (no auto-collapse). Only applied
// when this message is the latest bot message — historical messages render
// flat so users don't have to re-click through content they've already read.
const SequentialSubsections: React.FC<{
  preamble: string;
  subsections: H2Subsection[];
  // Called on mount and on every reveal so the parent can lock the chat
  // input + quick replies until everything's been read.
  onRevealStateChange?: (revealed: number, total: number) => void;
}> = ({ preamble, subsections, onRevealStateChange }) => {
  // revealedCount = number of sub-sections currently visible. Starts at 1
  // so the user sees the preamble + first h2 + first body on first render.
  const [revealedCount, setRevealedCount] = useState(1);
  // Ref attached to the most recently revealed sub-section so we can scroll
  // it into view when the user clicks the chevron — otherwise newly revealed
  // text appears below the fold and the user has to manually scroll.
  const lastRevealedRef = useRef<HTMLDivElement | null>(null);
  const prevRevealedRef = useRef(revealedCount);

  // Notify parent whenever revealed count changes (incl. mount).
  useEffect(() => {
    onRevealStateChange?.(revealedCount, subsections.length);
  }, [revealedCount, subsections.length, onRevealStateChange]);

  // Scroll the newly revealed sub-section to the top of the viewport when
  // revealedCount grows. Skipped on initial mount so first render doesn't
  // jump the page.
  useEffect(() => {
    if (revealedCount > prevRevealedRef.current && lastRevealedRef.current) {
      lastRevealedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevRevealedRef.current = revealedCount;
  }, [revealedCount]);

  return (
    <div>
      {preamble && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {preamble}
        </ReactMarkdown>
      )}
      {subsections.slice(0, revealedCount).map((sub, idx) => {
        // Render the title manually so we can prefix it with an icon.
        // The body still goes through ReactMarkdown for paragraph/list styling.
        // NOTE: `first:mt-0` would always trigger here because each subsection
        // is its own wrapper div, so we apply mt-6 unconditionally except on
        // the very first subsection (where the preamble's bottom margin is
        // already enough). This restores the breathing room above each h5.
        const Icon = iconForSubsection(sub.title);
        const isLastVisible = idx === revealedCount - 1;
        // Spacing above each sub-header. First one sits just below the intro
        // paragraph (modest gap). Subsequent ones get a clear visual break
        // (mt-10 = 40px) so they don't feel cramped against the previous
        // sub-section's last paragraph.
        const headingMargin = idx === 0 ? 'mt-4' : 'mt-10';
        // scroll-mt-[120px] leaves enough room above the wrapper for the
        // sticky page navbar (~73px) plus ~50px breathing room. Earlier
        // values were too small and the sub-header landed behind the navbar
        // — user could see the first sentence but not the heading itself.
        return (
          <div key={idx} ref={isLastVisible ? lastRevealedRef : undefined} className="scroll-mt-[120px]">
            <h5 className={`text-lg font-semibold text-atlas-teal mb-3 flex items-center gap-2.5 ${headingMargin}`}>
              {Icon && <Icon className="w-5 h-5 shrink-0" strokeWidth={2.25} />}
              <span>{sub.title}</span>
            </h5>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {sub.body}
            </ReactMarkdown>
          </div>
        );
      })}
      {revealedCount < subsections.length && (() => {
        const nextTitle = subsections[revealedCount].title;
        const NextIcon = iconForSubsection(nextTitle);
        return (
          <button
            type="button"
            onClick={() => setRevealedCount((c) => c + 1)}
            className="mt-6 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-atlas-teal/30 bg-atlas-teal/5 hover:bg-atlas-teal/10 hover:border-atlas-teal/50 transition-colors text-left group"
          >
            <span className="text-lg font-semibold text-atlas-teal flex items-center gap-2.5">
              {NextIcon && <NextIcon className="w-5 h-5 shrink-0" strokeWidth={2.25} />}
              <span>{nextTitle}</span>
            </span>
            <ChevronDown className="w-5 h-5 text-atlas-teal shrink-0 group-hover:translate-y-0.5 transition-transform" />
          </button>
        );
      })()}
    </div>
  );
};

// Renders a multi-career message as collapsible blocks.
// By default first career is open; when defaultAllCollapsed=true, all start closed.
// When onAllBlocksOpened is provided, fires once every block has been opened at least once.
const CollapsibleCareerBlocks: React.FC<{
  intro: string;
  blocks: CareerBlock[];
  defaultAllCollapsed?: boolean;
  onAllBlocksOpened?: () => void;
  sections?: ReportSection[];
}> = ({
  intro,
  blocks,
  defaultAllCollapsed = false,
  onAllBlocksOpened,
  sections,
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
      {titleBlock && (() => {
        const section = findSectionByTitle(sections, titleBlock.title);
        const score = section?.score != null ? Number(section.score) : null;
        const aiImpact = extractAIImpact(titleBlock.body || '');
        return (
          <div className="mb-3">
            <h3 className="text-lg font-bold text-atlas-navy font-heading mt-4 mb-2">
              {titleBlock.title}
            </h3>
            <CareerScoreCard
              score={Number.isFinite(score) ? score : null}
              aiImpact={aiImpact}
            />
            {titleBlock.body && (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {titleBlock.body}
              </ReactMarkdown>
            )}
          </div>
        );
      })()}

      {/* Sub-section blocks — collapsible */}
      {subBlocks.length > 0 && (
        <div className="flex flex-col gap-2">
          {subBlocks.map((block, idx) => {
            const isOpen = openIndices.has(idx);
            const section = findSectionByTitle(sections, block.title);
            const score = section?.score != null ? Number(section.score) : null;
            const aiImpact = extractAIImpact(block.body || '');
            const hasCard = (Number.isFinite(score) && score != null) || aiImpact;

            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Clickable header — always visible */}
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    {/* h3 so DOM section-detection still works */}
                    <h3 className="text-base font-bold text-atlas-navy font-heading m-0 leading-snug">
                      {block.title}
                    </h3>
                    {/* Show score + AI impact in the collapsed header so users
                        can scan all options without expanding each one. */}
                    {hasCard && (
                      <CareerScoreCard
                        score={Number.isFinite(score) ? score : null}
                        aiImpact={aiImpact}
                      />
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
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
  sections,
  isLatestBotMessage = false,
  onChipSend,
  onChipFocusInput,
  onSequentialRevealStateChange,
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

  // Section-reveal messages have multiple ## sub-sections (e.g. Approach,
  // Strengths, Development, Values) — apply sequential reveal so the user
  // gets one sub-section at a time. Applied to ALL such messages (not just
  // the latest) so historical section reveals are also collapsed and the
  // user can scroll up to a clean, scannable structure.
  const { preamble: subsectionPreamble, subsections } = splitIntoH2Subsections(sanitized);
  const useSequentialReveal = !hasMultipleBlocks && subsections.length >= 2;

  // Detect 'follow-up with options' messages (response to Explore More /
  // I see this differently). Only the latest bot message gets the chip
  // treatment so old follow-ups stay rendered as plain bullets — clicking
  // through historical chips wouldn't make sense conversationally.
  const followUpOptions =
    isLatestBotMessage && !hasMultipleBlocks && !useSequentialReveal
      ? detectFollowUpOptions(sanitized)
      : null;

  // For single-block messages (e.g. top_career_1/2/3), enrich the h3 renderer
  // so the score card appears right under the career title without changing
  // the surrounding markdown flow.
  const enrichedComponents = useMemo(() => {
    if (hasMultipleBlocks) return markdownComponents;
    return {
      ...markdownComponents,
      h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
        const headingText = React.Children.toArray(children)
          .map((c) => (typeof c === 'string' ? c : ''))
          .join('')
          .trim();
        const section = findSectionByTitle(sections, headingText);
        const score = section?.score != null ? Number(section.score) : null;
        // Look for an AI Impact rating anywhere in the message body.
        const aiImpact = extractAIImpact(sanitized);
        return (
          <>
            <h3
              className="text-lg font-bold text-atlas-navy mt-4 mb-2 font-heading"
              {...props}
            >
              {children}
            </h3>
            <CareerScoreCard
              score={Number.isFinite(score) ? score : null}
              aiImpact={section ? aiImpact : null}
            />
          </>
        );
      },
    };
  }, [hasMultipleBlocks, sections, sanitized]);

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
            sections={sections}
          />
        ) : useSequentialReveal ? (
          <SequentialSubsections
            preamble={subsectionPreamble}
            subsections={subsections}
            // Only the latest message reports state — older messages
            // shouldn't lock the input even if their state is partial.
            onRevealStateChange={isLatestBotMessage ? onSequentialRevealStateChange : undefined}
          />
        ) : followUpOptions ? (
          <div>
            {followUpOptions.intro && (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {followUpOptions.intro}
              </ReactMarkdown>
            )}
            {/* Claude-style multiple-choice container: single rounded card,
                each option a full-width row, thin teal divider between rows.
                Numbered prefix on regular options; pencil icon on the
                free-text 'Something else' option. */}
            <div className="mt-3 rounded-xl border border-atlas-teal/30 overflow-hidden bg-white">
              {followUpOptions.options.map((opt, i) => {
                const isLastOption = i === followUpOptions.options.length - 1;
                const isFreeText = opt.isFreeText;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (isFreeText) {
                        onChipFocusInput?.("Let me know what's on your mind…");
                      } else {
                        onChipSend?.(opt.message);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-atlas-teal/5 transition-colors ${
                      i > 0 ? 'border-t border-atlas-teal/15' : ''
                    }`}
                  >
                    {isFreeText ? (
                      <Pencil className="w-4 h-4 text-atlas-teal/70 shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-atlas-teal/10 text-atlas-teal flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium text-atlas-navy leading-snug">
                      {opt.display}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={enrichedComponents}>
            {sanitized}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};
