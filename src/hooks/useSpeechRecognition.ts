// Reusable hook for Web Speech API voice input
// Used by ChatInput and assessment long_text questions

import { useState, useRef, useEffect, useCallback } from 'react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface UseSpeechRecognitionOptions {
  /** Called with accumulated text on each recognition result */
  onTranscript: (text: string) => void;
  /** Existing text to prepend to transcript (e.g. current textarea value) */
  existingText?: string;
}

export function useSpeechRecognition({ onTranscript, existingText = '' }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref fresh without re-creating recognition
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    isListeningRef.current = false;
    finalTranscriptRef.current = '';
  }, []);

  const startListening = useCallback(async () => {
    if (!SpeechRecognitionAPI) return;
    if (isListeningRef.current) {
      stopListening();
      return;
    }

    // Request mic permission via getUserMedia (reliably triggers browser prompt)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      return; // User denied mic access
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    finalTranscriptRef.current = existingText ? existingText + ' ' : '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onTranscriptRef.current(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      // Auto-restart if still listening (recognition can timeout)
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore restart failures
        }
      }
    };

    recognition.onerror = (event: any) => {
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
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [existingText, stopListening]);

  // Toggle convenience
  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      isListeningRef.current = false;
    };
  }, []);

  return {
    isListening,
    isSupported: !!SpeechRecognitionAPI,
    toggleListening,
    stopListening,
  };
}
