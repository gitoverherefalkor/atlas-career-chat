import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { WelcomeCard } from './WelcomeCard';
import { WelcomeBackCard } from './WelcomeBackCard';
import { Loader2 } from 'lucide-react';
import { ALL_SECTIONS } from './ReportSidebar';
import type { ChatMessage as ChatMessageType } from '@/hooks/useChatMessages';
import type { ReportSection } from '@/hooks/useReportSections';

export interface ChatMessagesHandle {
  scrollToSection: (sectionId: string) => void;
}

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isWaitingForResponse: boolean;
  isUserTyping: boolean;
  currentSectionIndex: number;
  onSectionDetected: (index: number) => void;
  onQuickReply: (message: string) => void;
  // Optional placeholder lets quick-reply / chip clicks customize the input
  // prompt (e.g. 'Tell me how you see it…') when focusing without sending.
  onFocusInput: (placeholder?: string) => void;
  onDreamJobsRead?: () => void;
  // Forwarded from the latest bot message's SequentialSubsections so the
  // parent (ChatContainer) can lock the input until everything's read.
  onSequentialRevealStateChange?: (revealed: number, total: number) => void;
  // True when the latest section reveal still has hidden sub-sections.
  // We use this to suppress quick replies until the user has clicked
  // through every chevron — otherwise they'd react to half a section.
  hasUnrevealedSubsections?: boolean;
  // In-chat welcome card (shown as the empty state when no messages exist).
  showWelcome?: boolean;
  isReturningUser?: boolean;
  welcomeFirstName?: string;
  welcomeCompletedSectionIndex?: number;
  onWelcomeReady?: () => void;
  // Career sections from the user's report — used by ChatMessage to render
  // match scores + AI impact badges next to career titles.
  sections?: ReportSection[];
}

export const ChatMessages = forwardRef<ChatMessagesHandle, ChatMessagesProps>(
  ({ messages, isLoading, isWaitingForResponse, isUserTyping, currentSectionIndex, onSectionDetected, onQuickReply, onFocusInput, onDreamJobsRead, showWelcome, isReturningUser, welcomeFirstName, welcomeCompletedSectionIndex = -1, onWelcomeReady, sections, onSequentialRevealStateChange, hasUnrevealedSubsections = false }, ref) => {
    const isDreamJobsSection = currentSectionIndex >= ALL_SECTIONS.length - 1;
    const [dreamJobsOpened, setDreamJobsOpened] = useState(false);

    // Detect if the user has already sent a wrap-up message
    const hasWrappedUp = messages.some(
      (msg) => msg.sender === 'user' && msg.content.toLowerCase().includes('wrap up')
    );
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const isUserScrolledUpRef = useRef(false);
    const prevMessagesLengthRef = useRef(messages.length);

    // Track if user has scrolled up (to disable auto-scroll)
    const handleScroll = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const threshold = 100; // px from bottom
      isUserScrolledUpRef.current =
        container.scrollTop + container.clientHeight < container.scrollHeight - threshold;
    }, []);

    // When a new message arrives: scroll to the top of the new message so user reads from the start.
    // While waiting for a response: scroll to bottom to show the typing indicator.
    useEffect(() => {
      const newMessageArrived = messages.length > prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = messages.length;

      if (newMessageArrived) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.sender === 'bot') {
          // Scroll so the top of the new bot message is visible
          lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          isUserScrolledUpRef.current = false;
          return;
        }
      }

      // For user messages or typing indicator, scroll to bottom (unless user scrolled up)
      if (!isUserScrolledUpRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages.length, isWaitingForResponse]);

    // Expose scrollToSection for sidebar navigation.
    useImperativeHandle(ref, () => ({
      scrollToSection: (sectionId: string) => {
        const container = scrollContainerRef.current;
        if (!container) {
          console.log('[ScrollSection] no container');
          return;
        }
        // Find ALL matching headings and use the first one in DOM order —
        // the original section reveal, not any later deep-dive that
        // happens to mention the same name.
        const headings = container.querySelectorAll(`[data-section-id="${sectionId}"]`);
        console.log('[ScrollSection]', sectionId, 'matched', headings.length, 'elements');
        const heading = headings[0] as HTMLElement | undefined;
        if (!heading) {
          // Fallback: list all data-section-id elements so we can see what's tagged
          const allTagged = container.querySelectorAll('[data-section-id]');
          console.log('[ScrollSection] no match. All tagged:', Array.from(allTagged).map((el) => el.getAttribute('data-section-id')));
          return;
        }
        const containerRect = container.getBoundingClientRect();
        const headingRect = heading.getBoundingClientRect();
        const offsetWithinContainer = headingRect.top - containerRect.top + container.scrollTop;
        const target = Math.max(0, offsetWithinContainer - 16);
        console.log('[ScrollSection] scrolling to', target, '(currentScrollTop:', container.scrollTop, ')');
        container.scrollTo({ top: target, behavior: 'smooth' });
      },
    }));

    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-blue-100/70">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading conversation...</span>
          </div>
        </div>
      );
    }

    // Empty chat → render the WelcomeCard (or WelcomeBackCard) as the empty
    // state, vertically centered. This replaces the old standalone welcome
    // page so the user sees the chat layout (input + sidebar) right away.
    // They can either click "I'm Ready!" (auto-fires kickoff message via
    // autoResumeMessage) or just type their first message manually.
    //
    // Gate is purely based on messages.length so the welcome shows for ALL
    // empty-chat scenarios — new users, testers with a stale localStorage
    // sessionId, returning users whose stored session has no Supabase
    // messages yet. Once any message exists, welcome auto-hides.
    if (messages.length === 0 && !isWaitingForResponse) {
      return (
        <div className="flex-1 overflow-y-auto flex items-center justify-center px-3 sm:px-6 pt-4 pb-[180px] sm:pb-[140px]">
          {isReturningUser ? (
            <WelcomeBackCard
              onContinue={onWelcomeReady ?? (() => {})}
              firstName={welcomeFirstName || undefined}
              completedSectionIndex={welcomeCompletedSectionIndex}
            />
          ) : (
            <WelcomeCard
              onReady={onWelcomeReady ?? (() => {})}
              isLoading={false}
            />
          )}
        </div>
      );
    }

    return (
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-[800px] mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-[180px] sm:pb-[140px]">
          {messages.length === 0 && !isWaitingForResponse && (
            <div className="text-center text-blue-100/70 text-sm py-12">
              Send a message to start your session
            </div>
          )}

          {messages.map((msg, idx, arr) => {
            const isLastMessage = idx === arr.length - 1;
            const isLastBotMessage = isLastMessage && msg.sender === 'bot';
            // Most recent bot message in the array — may or may not be the
            // very last message (user could have typed a reply after it).
            // Computed inline because the JSX flow doesn't have a clean
            // place to memoize without restructuring the component.
            let latestBotIdx = -1;
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i].sender === 'bot') { latestBotIdx = i; break; }
            }
            const isLatestBotMessage = idx === latestBotIdx;
            // Dream jobs message: collapse all blocks by default, track when all opened
            const isDreamJobsMessage = isLastBotMessage && isDreamJobsSection;

            // Detect what KIND of bot message this is so QuickReplies show
            // the right set (or nothing):
            //  - Section reveal (### heading present): full replies after
            //    the user has clicked through every chevron.
            //  - Follow-up with options (no ###, multiple bold-bulleted
            //    items): no quick replies — the chips inside the message
            //    are the choice mechanism.
            //  - Deep dive (anything else from the bot): only 'Continue to
            //    next section'. The chat input handles further follow-ups.
            //    Prevents the explore-more loop reported earlier.
            const isSectionReveal = msg.sender === 'bot' && /^### /m.test(msg.content);
            const isFollowUp =
              isLastBotMessage &&
              msg.sender === 'bot' &&
              !isSectionReveal &&
              (msg.content.match(/^\s*-\s*\*\*/gm) || []).length >= 2;
            const isDeepDive =
              isLastBotMessage &&
              msg.sender === 'bot' &&
              !isSectionReveal &&
              !isFollowUp;

            return (
              <React.Fragment key={msg.id}>
                {isLastMessage && <div ref={lastMessageRef} />}
                <ChatMessage
                  content={msg.content}
                  sender={msg.sender}
                  onSectionDetected={onSectionDetected}
                  defaultAllCollapsed={isDreamJobsMessage}
                  onAllBlocksOpened={isDreamJobsMessage ? () => { setDreamJobsOpened(true); onDreamJobsRead?.(); } : undefined}
                  sections={sections}
                  isLatestBotMessage={isLatestBotMessage}
                  onChipSend={onQuickReply}
                  onChipFocusInput={onFocusInput}
                  onSequentialRevealStateChange={onSequentialRevealStateChange}
                />
                {isLastBotMessage && !isFollowUp && !hasUnrevealedSubsections && (
                  <QuickReplies
                    onSend={onQuickReply}
                    onFocusInput={onFocusInput}
                    visible={!isWaitingForResponse && !isUserTyping && (!isDreamJobsMessage || dreamJobsOpened)}
                    isLastSection={isDreamJobsSection}
                    isWrappedUp={hasWrappedUp}
                    isDeepDive={isDeepDive}
                  />
                )}
              </React.Fragment>
            );
          })}

          <TypingIndicator
            currentSectionIndex={currentSectionIndex}
            isVisible={isWaitingForResponse}
          />

          {/* Invisible anchor for auto-scrolling */}
          <div ref={bottomRef} />
        </div>
      </div>
    );
  }
);

ChatMessages.displayName = 'ChatMessages';
