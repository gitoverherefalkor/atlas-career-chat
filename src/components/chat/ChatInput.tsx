import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isSidebarCollapsed?: boolean;
}

const MIN_HEIGHT = 56;
const MAX_HEIGHT = 212; // 8 lines

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type here',
  isSidebarCollapsed = false,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false); // Mirror of isListening for closure access
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Check for speech recognition support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // Auto-resize textarea on content change
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  // Stop mic recording (shared by send + mic toggle)
  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    isListeningRef.current = false;
    finalTranscriptRef.current = '';
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    // Auto-stop mic when sending
    if (isListening) {
      stopListening();
    }

    onSend(trimmed);
    setText('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_HEIGHT}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input — request mic permission via getUserMedia first, then use SpeechRecognition
  // getUserMedia reliably triggers the browser permission popup; SpeechRecognition.start() often doesn't
  const toggleListening = async () => {
    console.log('[Mic] toggleListening called');
    console.log('[Mic] SpeechRecognition available:', !!SpeechRecognition);
    console.log('[Mic] isListening:', isListening);

    if (!SpeechRecognition) {
      console.warn('[Mic] SpeechRecognition not available — exiting');
      return;
    }

    if (isListening) {
      console.log('[Mic] Stopping recognition');
      stopListening();
      return;
    }

    // Step 1: Request mic permission explicitly via getUserMedia
    // This reliably triggers the browser permission prompt
    try {
      console.log('[Mic] Requesting mic permission via getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release the stream immediately — we just needed the permission grant
      stream.getTracks().forEach((track) => track.stop());
      console.log('[Mic] Mic permission granted');
    } catch (err) {
      console.error('[Mic] Mic permission denied or error:', err);
      return; // User denied mic access, don't proceed
    }

    // Step 2: Start SpeechRecognition (now that we have mic permission)
    console.log('[Mic] Creating new SpeechRecognition instance');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    finalTranscriptRef.current = text ? text + ' ' : '';

    recognition.onresult = (event: any) => {
      console.log('[Mic] onresult fired');
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setText(finalTranscriptRef.current + interim);
    };

    recognition.onstart = () => {
      console.log('[Mic] onstart fired — recognition is active');
    };

    recognition.onaudiostart = () => {
      console.log('[Mic] onaudiostart — microphone is capturing');
    };

    recognition.onend = () => {
      console.log('[Mic] onend fired, isListeningRef:', isListeningRef.current);
      // Auto-restart if still listening (recognition can timeout)
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('[Mic] Failed to auto-restart:', e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Mic] onerror:', event.error, event.message);
      if (event.error === 'not-allowed' || event.error === 'aborted') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    isListeningRef.current = true;

    try {
      recognition.start();
      console.log('[Mic] recognition.start() called successfully');
    } catch (e) {
      console.error('[Mic] recognition.start() threw:', e);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      isListeningRef.current = false;
    };
  }, []);

  const sidebarWidth = isSidebarCollapsed ? '48px' : '288px';

  return (
    <div
      className="fixed bottom-0 left-0 z-30"
      style={{ right: sidebarWidth }}
    >
      {/* Gradient fade */}
      <div className="h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />

      <div className="bg-gray-50 px-4 pb-4">
        <div className="max-w-[800px] mx-auto relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-white border border-gray-200 rounded-xl px-5 pr-[104px] py-4 text-[0.9375rem] leading-normal font-sans resize-none overflow-y-auto shadow-md focus:outline-none focus:border-atlas-teal focus:ring-2 focus:ring-atlas-teal/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          />

          {/* Buttons container — positioned inside the textarea visually */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Mic button — only show if browser supports speech recognition */}
            {SpeechRecognition && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                title={isListening ? 'Stop recording' : 'Voice input'}
                className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                  isListening
                    ? 'text-red-500 bg-red-50 animate-mic-pulse'
                    : 'text-gray-400 hover:text-atlas-teal hover:bg-atlas-teal/5'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Mic size={20} />
              </button>
            )}

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              title="Send message"
              className="flex items-center justify-center w-11 h-11 bg-atlas-teal rounded-md text-white transition-all hover:bg-atlas-teal/90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
