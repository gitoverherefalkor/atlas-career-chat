import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight, RefreshCw, Pencil } from 'lucide-react';

interface QuickReply {
  label: string;
  mobileLabel: string; // Shorter label for small screens
  message: string; // Text sent as a chat message (empty = focus input instead)
  icon: React.ReactNode;
}

interface QuickRepliesProps {
  onSend: (message: string) => void;
  onFocusInput: () => void;
  visible: boolean;
}

// Universal button set — works for all personality + career sections.
// The AI already knows the current section context and will respond appropriately.
const REPLIES: QuickReply[] = [
  {
    label: 'Looks good, next section',
    mobileLabel: 'Next section',
    message: 'Looks good, let\'s continue to the next section',
    icon: <ArrowRight size={14} />,
  },
  {
    label: 'I\'d like to explore this more',
    mobileLabel: 'Explore more',
    message: 'I\'d like to explore this section a bit more',
    icon: <RefreshCw size={14} />,
  },
  {
    label: 'I see this differently',
    mobileLabel: 'I disagree',
    message: 'I see this a bit differently, I have some feedback',
    icon: <MessageSquare size={14} />,
  },
  {
    label: 'Something else',
    mobileLabel: 'Something else',
    message: '', // Empty = focus input
    icon: <Pencil size={14} />,
  },
];

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSend, onFocusInput, visible }) => {
  const [show, setShow] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Appear with a slight delay after the bot message renders
  useEffect(() => {
    if (!visible) {
      setShow(false);
      setClicked(false);
      return;
    }

    const timer = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!show || clicked) return null;

  const handleClick = (reply: QuickReply) => {
    setClicked(true);

    if (reply.message) {
      onSend(reply.message);
    } else {
      // "Something else" — just focus the input so user can type freely
      onFocusInput();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {REPLIES.map((reply) => (
        <button
          key={reply.label}
          onClick={() => handleClick(reply)}
          className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3.5 py-2.5 sm:py-2 text-sm font-medium rounded-full
            border border-gray-200 bg-white text-gray-700
            hover:border-atlas-teal hover:text-atlas-teal hover:bg-atlas-teal/5
            active:bg-atlas-teal/10
            transition-all duration-150 shadow-sm hover:shadow"
        >
          {reply.icon}
          {/* Show shorter label on mobile, full label on sm+ */}
          <span className="sm:hidden">{reply.mobileLabel}</span>
          <span className="hidden sm:inline">{reply.label}</span>
        </button>
      ))}
    </div>
  );
};
