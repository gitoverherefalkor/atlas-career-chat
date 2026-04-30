import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { ChatMessages, ChatMessagesHandle } from './ChatMessages';
import { ChatInput, ChatInputHandle } from './ChatInput';
import { ALL_SECTIONS } from './ReportSidebar';
import { type QuickReplyIntent } from './QuickReplies';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useDeliverSection, type DeliverableSectionType } from '@/hooks/useDeliverSection';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useReportSections } from '@/hooks/useReportSections';
import { useToast } from '@/hooks/use-toast';

// Maps the sidebar section index (0..10) to the section_type used by the
// `deliver-section` edge function. Indices that aren't delivered via chat
// (executive-summary at 0) map to null.
const SECTION_INDEX_TO_TYPE: Record<number, DeliverableSectionType | null> = {
  0: null, // executive-summary — never delivered via chat
  1: 'approach',
  2: 'strengths',
  3: 'development',
  4: 'values',
  5: 'top_career_1',
  6: 'top_career_2',
  7: 'top_career_3',
  8: 'runner_ups',
  9: 'outside_box',
  10: 'dream_jobs',
};

/**
 * Feature flag for the platform-side fast-path delivery. Enabled when the
 * URL has `?fast=1`. Read once on first call so it's stable for a session.
 * Drop the param from the URL → revert to the existing n8n agent flow.
 */
function isFastPathEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('fast') === '1';
}

interface ChatContainerProps {
  reportId: string;
  userId: string;
  sessionId: string;
  firstName: string;
  country: string;
  currentSectionIndex: number;
  onSectionDetected: (index: number) => void;
  onSessionComplete: () => void;
  onDreamJobsRead?: () => void;
  onUserActivity?: () => void;
  isSessionCompleted: boolean;
  isSidebarCollapsed: boolean;
  autoResumeMessage?: string; // If set, send this message automatically on mount (for session resume)
  // Welcome card lives inside the chat as the empty state. Parent owns the
  // showWelcome flag so the page can react (e.g. dismiss on first user send).
  showWelcome?: boolean;
  isReturningUser?: boolean;
  welcomeCompletedSectionIndex?: number;
  onWelcomeReady?: () => void;
  onUserSentMessage?: () => void;
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
      onDreamJobsRead,
      onUserActivity,
      isSessionCompleted,
      isSidebarCollapsed,
      autoResumeMessage,
      showWelcome,
      isReturningUser,
      welcomeCompletedSectionIndex = -1,
      onWelcomeReady,
      onUserSentMessage,
    },
    ref
  ) => {
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [isUserTyping, setIsUserTyping] = useState(false);
    // When user clicks a quick-reply that focuses the input ('I see this
    // differently', 'Something else'), we set this to a custom placeholder
    // like 'Tell me how you see it…'. Cleared the moment the user actually
    // sends a message so it doesn't linger across turns.
    const [inputPlaceholderOverride, setInputPlaceholderOverride] = useState<string | null>(null);
    // Track how many sub-sections of the LATEST bot message are still hidden
    // behind a chevron. -1 = not yet reported (treat as locked); 0 = fully
    // revealed (unlocked); >0 = locked until reveals happen. New bot messages
    // reset to -1 so the UI defaults to LOCKED until ChatMessage reports
    // back, preventing a flash of QuickReplies before the sub-section
    // structure is registered.
    const [latestUnrevealedCount, setLatestUnrevealedCount] = useState(-1);
    const lastBotMessageIdRef = useRef<string | null>(null);
    const inputRef = useRef<ChatInputHandle>(null);
    const { toast } = useToast();
    const { sendMessage, loadPreviousSession } = useN8nWebhook();
    const { deliver } = useDeliverSection();
    const fastPathEnabled = useRef(isFastPathEnabled()).current;
    const { messages, isLoading, addMessage, seedFromHistory, hasMessages } =
      useChatMessages({ sessionId, reportId, userId });
    // Pull career sections from the report so ChatMessage can show match
    // scores + AI impact next to the career titles the agent presents.
    const { sections } = useReportSections(reportId);

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

    // ChatMessage is the source of truth for the latest bot message's
    // reveal state — it fires `onSequentialRevealStateChange` on mount
    // with either (1, total) for sub-section messages or (0, 0) for
    // discussion replies. We deliberately do NOT reset the count here
    // when `messages` changes: parent useEffects run AFTER child mount
    // effects, so a parent reset would clobber the child's correct
    // report. The ref is kept in case any other code path needs to
    // detect bot-message changes.
    useEffect(() => {
      const latestBot = [...messages].reverse().find((m) => m.sender === 'bot');
      if (latestBot && latestBot.id !== lastBotMessageIdRef.current) {
        lastBotMessageIdRef.current = latestBot.id;
      }
    }, [messages]);

    // Callback handed to SequentialSubsections (via ChatMessage). Receives
    // (revealed, total) — we store the gap as 'unrevealed'.
    const handleRevealStateChange = useCallback((revealed: number, total: number) => {
      setLatestUnrevealedCount(Math.max(0, total - revealed));
    }, []);

    // Auto-send a resume message when returning to the chat (e.g. after session restore)
    // This prevents the empty "Send a message to start your session" screen.
    const autoResumeAttemptedRef = useRef(false);
    useEffect(() => {
      if (!autoResumeMessage || autoResumeAttemptedRef.current) return;
      if (isLoading) return; // Wait until messages have loaded
      if (hasMessages) return; // If there are already messages, don't auto-send
      autoResumeAttemptedRef.current = true;

      // Small delay so the UI renders before the request fires
      const timer = setTimeout(() => {
        handleSend(autoResumeMessage);
      }, 300);
      return () => clearTimeout(timer);
    }, [isLoading, hasMessages, autoResumeMessage]);

    // Exact boilerplate intro phrases from the agent's BOILERPLATE QUICK REFERENCE.
    // ONLY used as fallback when heading-based detection misses.
    // Each phrase is taken verbatim from the knowledge base so they reliably
    // match and are long enough to avoid false positives in casual conversation.
    //
    // Heading detection (Strategy 1) already handles:
    //   - Approach/Strengths/Development/Values via SOP headers
    //   - Career 1-3 via "### Career N: [title]"
    //   - Runner-ups via "### Runner up: [title]"
    //
    // Boilerplate detection is critical for outside_box and dream_jobs
    // because their SOP header is just "### [career title]" with no prefix.
    const BOILERPLATE_PHRASES: { phrase: string; sectionIndex: number }[] = [
      // Approach — exact intro: "Let's dive into your personality profile."
      { phrase: "let's dive into your personality profile", sectionIndex: 1 },
      // Strengths — exact intro: "Let's talk about your strengths"
      { phrase: "let's talk about your strengths", sectionIndex: 2 },
      // Development — exact intro: "Now for the growth opportunities"
      { phrase: 'now for the growth opportunities', sectionIndex: 3 },
      // Values — exact intro: "let's look at your core values"
      { phrase: "let's look at your core values", sectionIndex: 4 },
      // Top Career 1 — exact intro: "one of the most suitable jobs for you is"
      { phrase: 'one of the most suitable jobs for you is', sectionIndex: 5 },
      // Career 2 — agent often says "that was your second career match" or "your second top career"
      { phrase: 'second career match', sectionIndex: 6 },
      { phrase: 'second top career', sectionIndex: 6 },
      { phrase: 'your second career', sectionIndex: 6 },
      // Career 3 — agent often says "that was your third career match" or "your third top career"
      { phrase: 'third career match', sectionIndex: 7 },
      { phrase: 'third top career', sectionIndex: 7 },
      { phrase: 'your third career', sectionIndex: 7 },
      // Runner-ups — exact intro phrase as backup for heading detection
      { phrase: 'runner-up career matches', sectionIndex: 8 },
      // Outside-the-box — NEEDS boilerplate (bare ### [title] headers in SOP)
      { phrase: 'outside-the-box career options', sectionIndex: 9 },
      // Dream jobs — NEEDS boilerplate (bare ### [title] headers in SOP)
      // Multiple phrases across intro/outro in case agent paraphrases the intro
      { phrase: 'everyone has an idea of their ideal job', sectionIndex: 10 },
      { phrase: "that's your dream job analysis", sectionIndex: 10 },
      { phrase: 'your dream job assessment', sectionIndex: 10 },
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

      // Strategy 2: Boilerplate phrase detection — always runs alongside heading detection.
      // Safe to always check because phrases are long/specific enough to avoid false positives,
      // and onSectionDetected uses Math.max so it can only move the sidebar forward.
      for (const { phrase, sectionIndex } of BOILERPLATE_PHRASES) {
        if (lower.includes(phrase)) {
          console.log('[Section] Boilerplate match:', `"${phrase}"`, '→', ALL_SECTIONS[sectionIndex].title);
          onSectionDetected(sectionIndex);
          break; // One match per message is enough
        }
      }

      // Check for session complete signal
      if (content.includes('SESSION_COMPLETE')) {
        onSessionComplete();
      }
    };

    // Called by quick replies that focus the input instead of sending a
    // message. Optional placeholder overrides the default "Type here" so the
    // user sees an inviting prompt that matches what we asked them to share.
    const handleFocusInput = (placeholder?: string) => {
      setInputPlaceholderOverride(placeholder ?? null);
      inputRef.current?.focus();
    };

    const handleSend = async (message: string, intent?: QuickReplyIntent) => {
      if (isSessionCompleted || isWaitingForResponse) return;

      // Dismiss the in-chat welcome card the moment the user sends anything,
      // so manually typing a first message has the same effect as clicking
      // "I'm Ready!".
      onUserSentMessage?.();
      // Clear any custom placeholder set by a previous quick reply.
      setInputPlaceholderOverride(null);

      // Add user message immediately
      addMessage('user', message);
      setIsWaitingForResponse(true);
      onUserActivity?.();

      // Fast path: clean "Continue to next section" click with no LLM
      // reasoning needed. Skip the n8n agent and call the deliver-section
      // edge function for a deterministic templated delivery.
      // Gated on `?fast=1` so we can A/B test live without breaking the
      // existing flow. Falls back to the agent path on any error.
      const previousType = SECTION_INDEX_TO_TYPE[currentSectionIndex] ?? undefined;
      const nextType = SECTION_INDEX_TO_TYPE[currentSectionIndex + 1] ?? undefined;
      const shouldUseFastPath =
        fastPathEnabled &&
        intent === 'advance' &&
        nextType !== undefined &&
        currentSectionIndex >= 1; // Welcome → approach handled separately

      if (shouldUseFastPath && nextType) {
        try {
          const response = await deliver({
            reportId,
            sectionType: nextType,
            previousSectionType: previousType,
            userMessage: message,
          });

          addMessage('bot', response);
          scanForSections(response);
          setIsWaitingForResponse(false);
          return;
        } catch (error) {
          // Don't toast — silently fall back to the agent path so the
          // user still gets a response. Log so we notice in dev.
          console.error('[fast-path] deliver-section failed, falling back to agent:', error);
          // Fall through to the agent path below.
        }
      }

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
          isUserTyping={isUserTyping}
          currentSectionIndex={currentSectionIndex}
          onSectionDetected={onSectionDetected}
          onQuickReply={handleSend}
          onFocusInput={handleFocusInput}
          onDreamJobsRead={onDreamJobsRead}
          onSequentialRevealStateChange={handleRevealStateChange}
          hasUnrevealedSubsections={latestUnrevealedCount !== 0}
          showWelcome={showWelcome}
          isReturningUser={isReturningUser}
          welcomeFirstName={firstName}
          welcomeCompletedSectionIndex={welcomeCompletedSectionIndex}
          onWelcomeReady={onWelcomeReady}
          sections={sections}
        />

        {/* Mobile-only Complete Session CTA — sidebar button isn't visible on mobile */}
        {isSessionCompleted && (
          <div className="md:hidden px-4 py-3 bg-white border-t border-gray-100">
            <button
              onClick={onSessionComplete}
              className="w-full bg-atlas-teal text-white rounded-full py-3 font-semibold text-sm flex items-center justify-center gap-2"
            >
              View Your Report →
            </button>
          </div>
        )}

        <ChatInput
          ref={inputRef}
          onSend={handleSend}
          onTypingChange={setIsUserTyping}
          // Disable typing on the welcome screen so users can't accidentally
          // start with an off-script message that confuses the bot. They
          // click "I'm Ready!" to kick off, then type freely from there.
          // Also disabled while the latest section reveal still has hidden
          // sub-sections — forces the user to read everything before they
          // can react.
          disabled={
            isSessionCompleted ||
            isWaitingForResponse ||
            (messages.length === 0 && !isWaitingForResponse) ||
            latestUnrevealedCount !== 0
          }
          placeholder={
            isSessionCompleted
              ? 'Session completed - your report is ready above'
              : messages.length === 0
                ? "Click 'I'm Ready!' above to begin"
                : latestUnrevealedCount > 0
                  ? `Click to reveal the next ${latestUnrevealedCount} section${latestUnrevealedCount === 1 ? '' : 's'}…`
                  : (inputPlaceholderOverride ?? 'Type here')
          }
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
