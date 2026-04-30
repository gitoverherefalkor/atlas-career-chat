import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Settings2, Check } from 'lucide-react';
import { useTTS } from '@/contexts/TTSContext';

interface MessageVoiceButtonProps {
  messageId: string;
  text: string;
  // Latest bot message gets the BETA pill so users discover the feature
  // without it being repeated on every historical bubble.
  showBetaBadge?: boolean;
}

export const MessageVoiceButton: React.FC<MessageVoiceButtonProps> = ({
  messageId,
  text,
  showBetaBadge = false,
}) => {
  const {
    isSupported,
    speakingId,
    speak,
    stop,
    gender,
    setGender,
    readAll,
    setReadAll,
  } = useTTS();

  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the popover on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (!isSupported) return null;

  const isThisSpeaking = speakingId === messageId;

  const handleToggle = () => {
    if (isThisSpeaking) {
      stop();
    } else {
      speak(text, messageId);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs"
    >
      <button
        type="button"
        onClick={handleToggle}
        title={isThisSpeaking ? 'Stop' : 'Read aloud'}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
          isThisSpeaking
            ? 'bg-atlas-teal/10 text-atlas-teal'
            : 'text-gray-500 hover:text-atlas-teal hover:bg-atlas-teal/5'
        }`}
      >
        {isThisSpeaking ? (
          <Square size={13} fill="currentColor" />
        ) : (
          <Volume2 size={14} />
        )}
        <span className="font-medium">
          {isThisSpeaking ? 'Stop' : 'Read aloud'}
        </span>
      </button>

      {showBetaBadge && (
        <span className="px-1.5 py-0.5 rounded bg-atlas-teal/10 text-atlas-teal text-[10px] font-bold tracking-wide uppercase">
          Beta
        </span>
      )}

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          title="Voice settings"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-400 hover:text-atlas-teal hover:bg-atlas-teal/5 transition-colors"
        >
          <Settings2 size={13} />
          <span>{gender === 'female' ? 'Female' : 'Male'}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-20">
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Voice
            </div>
            <VoiceOption
              label="Female"
              active={gender === 'female'}
              onClick={() => setGender('female')}
            />
            <VoiceOption
              label="Male"
              active={gender === 'male'}
              onClick={() => setGender('male')}
            />
            <div className="border-t border-gray-100 my-1" />
            <button
              type="button"
              onClick={() => setReadAll(!readAll)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-left"
            >
              <span className="text-sm text-atlas-navy">
                Read all new responses
              </span>
              <span
                className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors ${
                  readAll ? 'bg-atlas-teal' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white transition-transform ${
                    readAll ? 'translate-x-[14px]' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const VoiceOption: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors ${
      active ? 'text-atlas-teal font-semibold' : 'text-atlas-navy hover:bg-gray-50'
    }`}
  >
    <span>{label}</span>
    {active && <Check size={14} className="text-atlas-teal" />}
  </button>
);
