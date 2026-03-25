import React, { useState, useEffect } from 'react';
import { ThumbsDown, ArrowRight, CheckCircle, Search, Pencil } from 'lucide-react';

interface QuickReply {
  label: string;
  mobileLabel: string; // Shorter label for small screens
  message: string; // Text sent as a chat message (empty = focus input instead)
  icon: React.ReactNode;
  variant?: 'default' | 'primary'; // Visual emphasis
}

interface QuickRepliesProps {
  onSend: (message: string) => void;
  onFocusInput: () => void;
  visible: boolean;
  isLastSection?: boolean; // True when on dream jobs (final section)
}

// Standard button set for all sections except the last one.
const STANDARD_REPLIES: QuickReply[] = [
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
    icon: <Search size={14} />,
  },
  {
    label: 'I see this differently',
    mobileLabel: 'I disagree',
    message: 'I see this a bit differently, I have some feedback',
    icon: <ThumbsDown size={14} />,
  },
  {
    label: 'Something else',
    mobileLabel: 'Something else',
    message: '', // Empty = focus input
    icon: <Pencil size={14} />,
  },
];

// Final section (dream jobs) — "next section" becomes "wrap up"
const FINAL_REPLIES: QuickReply[] = [
  {
    label: 'All done, wrap up session',
    mobileLabel: 'Wrap up',
    message: 'Looks good, I\'m all done! Let\'s wrap up the session.',
    icon: <CheckCircle size={14} />,
    variant: 'primary',
  },
  {
    label: 'I\'d like to explore this more',
    mobileLabel: 'Explore more',
    message: 'I\'d like to explore this section a bit more',
    icon: <Search size={14} />,
  },
  {
    label: 'I see this differently',
    mobileLabel: 'I disagree',
    message: 'I see this a bit differently, I have some feedback',
    icon: <ThumbsDown size={14} />,
  },
  {
    label: 'Something else',
    mobileLabel: 'Something else',
    message: '', // Empty = focus input
    icon: <Pencil size={14} />,
  },
];

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSend, onFocusInput, visible, isLastSection = false }) => {
  const replies = isLastSection ? FINAL_REPLIES : STANDARD_REPLIES;
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
      {replies.map((reply) => {
        const isPrimary = reply.variant === 'primary';
        return (
          <button
            key={reply.label}
            onClick={() => handleClick(reply)}
            className={`inline-flex items-center justify-center sm:justify-start gap-1.5 px-3.5 py-2.5 sm:py-2 text-sm font-medium rounded-full
              transition-all duration-150 shadow-sm hover:shadow
              ${isPrimary
                ? 'border border-atlas-teal bg-atlas-teal/10 text-atlas-teal hover:bg-atlas-teal hover:text-white active:bg-atlas-teal/90'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-atlas-teal hover:text-atlas-teal hover:bg-atlas-teal/5 active:bg-atlas-teal/10'
              }`}
          >
            {reply.icon}
            <span className="sm:hidden">{reply.mobileLabel}</span>
            <span className="hidden sm:inline">{reply.label}</span>
          </button>
        );
      })}
    </div>
  );
};
