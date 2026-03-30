import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { Loader2 } from 'lucide-react';
import { ALL_SECTIONS } from './ReportSidebar';
import type { ChatMessage as ChatMessageType } from '@/hooks/useChatMessages';

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
  onFocusInput: () => void;
  onDreamJobsRead?: () => void;
}

export const ChatMessages = forwardRef<ChatMessagesHandle, ChatMessagesProps>(
  ({ messages, isLoading, isWaitingForResponse, isUserTyping, currentSectionIndex, onSectionDetected, onQuickReply, onFocusInput, onDreamJobsRead }, ref) => {
    const isDreamJobsSection = currentSectionIndex >= ALL_SECTIONS.length - 1;
    const [dreamJobsOpened, setDreamJobsOpened] = useState(false);

    // Detect if the user has already sent a wrap-up message
    const hasWrappedUp = messages.some(
      (msg) => msg.sender === 'user' && msg.content.toLowerCase().includes('wrap up')
    );
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isUserScrolledUpRef = useRef(false);

    // Track if user has scrolled up (to disable auto-scroll)
    const handleScroll = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const threshold = 100; // px from bottom
      isUserScrolledUpRef.current =
        container.scrollTop + container.clientHeight < container.scrollHeight - threshold;
    }, []);

    // Auto-scroll to bottom when new messages arrive (unless user scrolled up)
    useEffect(() => {
      if (!isUserScrolledUpRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages.length, isWaitingForResponse]);

    // Expose scrollToSection for sidebar navigation
    useImperativeHandle(ref, () => ({
      scrollToSection: (sectionId: string) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const heading = container.querySelector(`[data-section-id="${sectionId}"]`);
        if (heading) {
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
    }));

    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading conversation...</span>
          </div>
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
            <div className="text-center text-gray-400 text-sm py-12">
              Send a message to start your session
            </div>
          )}

          {messages.map((msg, idx) => {
            const isLastMessage = idx === messages.length - 1;
            const isLastBotMessage = isLastMessage && msg.sender === 'bot';
            // Dream jobs message: collapse all blocks by default, track when all opened
            const isDreamJobsMessage = isLastBotMessage && isDreamJobsSection;

            return (
              <React.Fragment key={msg.id}>
                <ChatMessage
                  content={msg.content}
                  sender={msg.sender}
                  onSectionDetected={onSectionDetected}
                  defaultAllCollapsed={isDreamJobsMessage}
                  onAllBlocksOpened={isDreamJobsMessage ? () => { setDreamJobsOpened(true); onDreamJobsRead?.(); } : undefined}
                />
                {isLastBotMessage && (
                  <QuickReplies
                    onSend={onQuickReply}
                    onFocusInput={onFocusInput}
                    visible={!isWaitingForResponse && !isUserTyping && (!isDreamJobsMessage || dreamJobsOpened)}
                    isLastSection={isDreamJobsSection}
                    isWrappedUp={hasWrappedUp}
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
