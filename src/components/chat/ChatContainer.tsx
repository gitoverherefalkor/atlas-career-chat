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
          history.forEach((msg) => {
            if (msg.sender === 'bot') {
              scanForSections(msg.content);
            }
          });
        }
      };

      tryLoadPrevious();
    }, [isLoading, hasMessages, sessionId, reportId, firstName, country, loadPreviousSession, seedFromHistory]);

    // Scan bot message content for section headings
    const scanForSections = (content: string) => {
      // Look for markdown headings (### Title) or HTML headings (<h3>Title</h3>)
      const headingRegex = /(?:###\s*(.+)|<h3[^>]*>(.+?)<\/h3>)/gi;
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        const headingText = (match[1] || match[2] || '').trim();
        if (headingText) {
          const normalized = headingText.toLowerCase();
          const idx = ALL_SECTIONS.findIndex((section: any) => {
            if (normalized.includes(section.title.toLowerCase())) return true;
            if (section.altTitles?.some((alt: string) => normalized.includes(alt.toLowerCase()))) return true;
            if (normalized.includes(section.id.replace(/-/g, ' '))) return true;
            return false;
          });
          if (idx >= 0) {
            onSectionDetected(idx);
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
