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

    // Boilerplate phrases the agent uses when introducing each section.
    // ONLY used as fallback when heading-based detection misses.
    // Phrases must be long/unique enough to avoid false positives — the bot
    // could casually say "dream job" or "core values" in any section, so
    // short generic phrases are deliberately excluded here.
    // Heading detection (Strategy 1) already handles most sections via
    // SOP headers like "### Career 1:", "### Runner up:", etc.
    const BOILERPLATE_PHRASES: { phrase: string; sectionIndex: number }[] = [
      // About You — heading detection handles these well, but keep unique intros as backup
      { phrase: 'dive into your personality profile', sectionIndex: 1 },
      { phrase: "let's talk about your strengths", sectionIndex: 2 },
      { phrase: "let's look at your core values", sectionIndex: 4 },
      // Career Suggestions — heading detection handles Career 1-3 and Runner-ups
      { phrase: 'most suitable jobs for you', sectionIndex: 5 },
      // Outside-the-box + Dream jobs: SOP uses bare "### [career title]" headers
      // with no section prefix, so heading detection can't identify them.
      // These NEED boilerplate detection — use the longest unique phrases possible.
      { phrase: 'outside-the-box career options', sectionIndex: 9 },
      { phrase: 'outside the box career options', sectionIndex: 9 },
      { phrase: 'unconventional career options', sectionIndex: 9 },
      { phrase: "let's analyze your dream job", sectionIndex: 10 },
      { phrase: 'dream job assessment', sectionIndex: 10 },
      { phrase: 'dream job analysis', sectionIndex: 10 },
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
