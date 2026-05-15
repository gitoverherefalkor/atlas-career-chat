import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SupportForm from './SupportForm';

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support &amp; Feedback</DialogTitle>
          <DialogDescription>
            Questions, problems, or ideas? We read every message.
          </DialogDescription>
        </DialogHeader>
        <SupportForm />
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
