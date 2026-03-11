import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { ChatMessages, ChatMessagesHandle } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ALL_SECTIONS } from './ReportSidebar';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useToast } from '@/hooks/use-toast';

interface ChatContainerProps {
  reportId: string;
  userId: string;
  sessionId: string;
  firstName: string;
  country: string;
  currentSectionIndex: number;
  onSectionDetected: (index: number) => void;
  onSessionComplete: () => void;
  isSessionCompleted: boolean;
  isSidebarCollapsed: boolean;
}

export const ChatContainer = forwardRef<ChatMessagesHandle, ChatContainerProps>(
  (
    {
      reportId,
      userId,
      sessionId,
      firstName,
      country,
      currentSectionIndex,
      onSectionDetected,
      onSessionComplete,
      isSessionCompleted,
      isSidebarCollapsed,
    },
    ref
  ) => {
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const { toast } = useToast();
    const { sendMessage, loadPreviousSession } = useN8nWebhook();
    const { messages, isLoading, addMessage, seedFromHistory, hasMessages } =
      useChatMessages({ sessionId, reportId, userId });

    // Track whether we've attempted to load previous session from n8n
    const migrationAttemptedRef = useRef(false);
    const sectionScanDoneRef = useRef(false);

    // On mount: if no messages in Supabase, try loading from n8n (migration path)
    useEffect(() => {
      if (isLoading || migrationAttemptedRef.current) return;
      if (hasMessages) return; // Already have messages in Supabase

      migrationAttemptedRef.current = true;

      const tryLoadPrevious = async () => {
        const history = await loadPreviousSession(sessionId, {
          report_id: reportId,
          first_name: firstName,
          country,
        });

        if (history.length > 0) {
          seedFromHistory(history);

          // Scan history for section headers
          console.log('[Section] Scanning', history.length, 'messages from n8n migration');
          history.forEach((msg) => {
            if (msg.sender === 'bot') {
              scanForSections(msg.content);
            }
          });
          sectionScanDoneRef.current = true;
        }
      };

      tryLoadPrevious();
    }, [isLoading, hasMessages, sessionId, reportId, firstName, country, loadPreviousSession, seedFromHistory]);

    // Backup: scan messages loaded from Supabase for sections (runs once after load)
    useEffect(() => {
      if (isLoading || !hasMessages || sectionScanDoneRef.current) return;
      sectionScanDoneRef.current = true;

      console.log('[Section] Scanning', messages.length, 'messages from Supabase');
      messages.forEach((msg) => {
        if (msg.sender === 'bot') {
          scanForSections(msg.content);
        }
      });
    }, [isLoading, hasMessages, messages]);

    // Boilerplate phrases the agent always uses when introducing each section.
    // Matched against the full message content (case-insensitive) as a fallback
    // when heading-based detection misses (e.g. career sections with dynamic titles).
    const BOILERPLATE_PHRASES: { phrase: string; sectionIndex: number }[] = [
      // About You
      { phrase: 'executive summary', sectionIndex: 0 },
      { phrase: 'personality profile', sectionIndex: 1 },
      { phrase: 'dive into your personality', sectionIndex: 1 },
      { phrase: 'understanding your approach', sectionIndex: 1 },
      { phrase: "let's talk about your strengths", sectionIndex: 2 },
      { phrase: 'your core strengths', sectionIndex: 2 },
      { phrase: 'growth opportunities', sectionIndex: 3 },
      { phrase: 'areas for development', sectionIndex: 3 },
      { phrase: 'development areas', sectionIndex: 3 },
      { phrase: 'core values', sectionIndex: 4 },
      { phrase: 'career values', sectionIndex: 4 },
      { phrase: "let's look at your core values", sectionIndex: 4 },
      // Career Suggestions
      { phrase: 'most suitable jobs for you', sectionIndex: 5 },
      { phrase: 'top career match', sectionIndex: 5 },
      { phrase: 'first career suggestion', sectionIndex: 5 },
      { phrase: 'one of the most suitable', sectionIndex: 5 },
      { phrase: 'second career', sectionIndex: 6 },
      { phrase: 'another great fit', sectionIndex: 6 },
      { phrase: 'third career', sectionIndex: 7 },
      { phrase: 'runner-up career', sectionIndex: 8 },
      { phrase: 'runner up career', sectionIndex: 8 },
      { phrase: 'honorable mention', sectionIndex: 8 },
      { phrase: 'outside-the-box career', sectionIndex: 9 },
      { phrase: 'outside the box career', sectionIndex: 9 },
      { phrase: 'unconventional career', sectionIndex: 9 },
      { phrase: 'dream job', sectionIndex: 10 },
      { phrase: 'dream career', sectionIndex: 10 },
    ];

    // Scan bot message content for section headings and boilerplate phrases
    const scanForSections = (content: string) => {
      const lower = content.toLowerCase();

      // Strategy 1: Look for markdown headings (### Title) or HTML headings (<h3>Title</h3>)
      const headingRegex = /(?:###\s*(.+)|<h3[^>]*>(.+?)<\/h3>)/gi;
      let match;
      let foundViaHeading = false;
      while ((match = headingRegex.exec(content)) !== null) {
        const headingText = (match[1] || match[2] || '').trim();
        if (headingText) {
          console.log('[Section] Regex found heading:', headingText);
          const normalized = headingText.toLowerCase();
          const idx = ALL_SECTIONS.findIndex((section: any) => {
            if (normalized.includes(section.title.toLowerCase())) return true;
            if (section.altTitles?.some((alt: string) => normalized.includes(alt.toLowerCase()))) return true;
            if (normalized.includes(section.id.replace(/-/g, ' '))) return true;
            return false;
          });
          console.log('[Section] Heading match:', idx, idx >= 0 ? `(${ALL_SECTIONS[idx].title})` : '(no match)');
          if (idx >= 0) {
            onSectionDetected(idx);
            foundViaHeading = true;
          }
        }
      }

      // Strategy 2: Boilerplate phrase detection (catches sections without recognizable headings)
      if (!foundViaHeading) {
        for (const { phrase, sectionIndex } of BOILERPLATE_PHRASES) {
          if (lower.includes(phrase)) {
            console.log('[Section] Boilerplate match:', `"${phrase}"`, '→', ALL_SECTIONS[sectionIndex].title);
            onSectionDetected(sectionIndex);
            break; // One match per message is enough
          }
        }
      }

      // Check for session complete signal
      if (content.includes('SESSION_COMPLETE')) {
        onSessionComplete();
      }
    };

    const handleSend = async (message: string) => {
      if (isSessionCompleted || isWaitingForResponse) return;

      // Add user message immediately
      addMessage('user', message);
      setIsWaitingForResponse(true);

      try {
        const response = await sendMessage(sessionId, message, {
          report_id: reportId,
          first_name: firstName,
          country,
        });

        if (response) {
          addMessage('bot', response);
          scanForSections(response);
        } else {
          addMessage('bot', 'I didn\'t receive a response. Please try again.');
        }
      } catch (error) {
        console.error('Failed to send message:', error);

        const errorMessage =
          error instanceof DOMException && error.name === 'AbortError'
            ? 'The request timed out. The AI is taking longer than usual. Please try again.'
            : 'Something went wrong. Please try sending your message again.';

        toast({
          title: 'Message failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsWaitingForResponse(false);
      }
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
        <ChatMessages
          ref={ref}
          messages={messages}
          isLoading={isLoading}
          isWaitingForResponse={isWaitingForResponse}
          currentSectionIndex={currentSectionIndex}
          onSectionDetected={onSectionDetected}
        />

        <ChatInput
          onSend={handleSend}
          disabled={isSessionCompleted || isWaitingForResponse}
          placeholder={
            isSessionCompleted
              ? 'Session completed - click Complete Session to view your report'
              : 'Type here'
          }
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
