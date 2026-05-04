import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { CareerSignatureCard } from '@/components/chat/CareerSignatureCard';

interface CareerSignatureModalProps {
  reportId: string;
  open: boolean;
  onClose: () => void;
}

// Modal that pops the full-size Career Signature when the compact dashboard
// card is clicked. Backdrop blur + escape key close + click-outside close.
export const CareerSignatureModal: React.FC<CareerSignatureModalProps> = ({ reportId, open, onClose }) => {
  // Lock body scroll while the modal is open so background doesn't drift.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-atlas-navy/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white border border-atlas-navy/10 shadow-md flex items-center justify-center text-atlas-navy hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
        </button>
        <CareerSignatureCard reportId={reportId} variant="full" />
      </div>
    </div>
  );
};
