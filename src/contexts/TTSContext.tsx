import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Web Speech API doesn't expose voice gender, so we match by name. Order
// matters — earlier entries are preferred when multiple voices are available.
const FEMALE_VOICE_HINTS = [
  'samantha', 'karen', 'moira', 'tessa', 'victoria', 'serena', 'kate', 'fiona',
  'zira', 'aria', 'jenny', 'jessa', 'libby',
  'google us english', 'google uk english female',
  'female',
];
const MALE_VOICE_HINTS = [
  'daniel', 'alex', 'fred', 'tom', 'oliver', 'rishi', 'aaron', 'arthur',
  'david', 'mark', 'guy', 'ryan',
  'google uk english male',
  'male',
];

export type VoiceGender = 'female' | 'male';

const STORAGE_KEY_GENDER = 'atlas:tts:gender';
const STORAGE_KEY_READ_ALL = 'atlas:tts:read-all';

interface TTSContextValue {
  isSupported: boolean;
  isSpeaking: boolean;
  speakingId: string | null;
  gender: VoiceGender;
  setGender: (g: VoiceGender) => void;
  readAll: boolean;
  setReadAll: (v: boolean) => void;
  speak: (text: string, id: string) => void;
  stop: () => void;
}

const TTSContext = createContext<TTSContextValue | null>(null);

// Strip markdown / HTML so the synthesizer reads natural prose instead of
// "asterisk asterisk header asterisk asterisk".
function stripForSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [gender, setGenderState] = useState<VoiceGender>(() => {
    if (typeof window === 'undefined') return 'female';
    return localStorage.getItem(STORAGE_KEY_GENDER) === 'male' ? 'male' : 'female';
  });
  const [readAll, setReadAllState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_READ_ALL) === 'true';
  });

  // Chrome loads voices asynchronously; subscribe to onvoiceschanged.
  useEffect(() => {
    if (!isSupported) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update);
    };
  }, [isSupported]);

  // Cancel any ongoing utterance if the provider unmounts (e.g. user navigates
  // away from /chat) — otherwise the voice keeps playing on the next page.
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const pickVoice = useCallback(
    (g: VoiceGender): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;
      const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
      const pool = english.length > 0 ? english : voices;
      const hints = g === 'female' ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
      for (const hint of hints) {
        const match = pool.find((v) => v.name.toLowerCase().includes(hint));
        if (match) return match;
      }
      return pool[0];
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, id: string) => {
      if (!isSupported) return;
      const cleaned = stripForSpeech(text);
      if (!cleaned) return;
      // Always cancel anything in progress so the new utterance starts fresh.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voice = pickVoice(gender);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingId(id);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingId((current) => (current === id ? null : current));
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingId((current) => (current === id ? null : current));
      };
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, pickVoice, gender]
  );

  const setGender = useCallback((g: VoiceGender) => {
    setGenderState(g);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_GENDER, g);
    }
  }, []);

  const setReadAll = useCallback((v: boolean) => {
    setReadAllState(v);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_READ_ALL, String(v));
    }
  }, []);

  const value: TTSContextValue = {
    isSupported,
    isSpeaking,
    speakingId,
    gender,
    setGender,
    readAll,
    setReadAll,
    speak,
    stop,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
};

export function useTTS(): TTSContextValue {
  const ctx = useContext(TTSContext);
  if (!ctx) {
    // Fallback no-op implementation — keeps consumers safe if rendered
    // outside the provider (e.g. unit tests or a stripped-down view).
    return {
      isSupported: false,
      isSpeaking: false,
      speakingId: null,
      gender: 'female',
      setGender: () => {},
      readAll: false,
      setReadAll: () => {},
      speak: () => {},
      stop: () => {},
    };
  }
  return ctx;
}
