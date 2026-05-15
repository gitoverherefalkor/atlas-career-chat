import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/submit-support-request`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SUPPORT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'access_code_payment', label: 'Access code / payment' },
  { value: 'assessment_survey', label: 'Assessment / survey' },
  { value: 'ai_chat', label: 'AI Chat' },
  { value: 'my_report', label: 'My report' },
  { value: 'job_openings', label: 'Job openings' },
  { value: 'account_login', label: 'Account / login' },
  { value: 'feature_idea', label: 'Feature idea' },
  { value: 'bug_report', label: 'Bug report' },
  { value: 'something_else', label: 'Something else' },
];

// Pull the access code from the URL or from purchase_data in localStorage,
// so support tickets carry it automatically when the user is in a flow.
function readAccessCode(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('code');
    if (fromUrl) return fromUrl;
    const stored = localStorage.getItem('purchase_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.accessCode) return String(parsed.accessCode);
    }
  } catch {
    // ignore — access code is optional context
  }
  return null;
}

interface SupportFormProps {
  onSuccess?: () => void;
}

const SupportForm = ({ onSuccess }: SupportFormProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isLoggedIn = !!user;
  const isBug = category === 'bug_report';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!category) {
      setErrorMsg('Please pick what this is about.');
      return;
    }
    if (message.trim().length === 0) {
      setErrorMsg('Please enter a message.');
      return;
    }
    if (!isLoggedIn && !EMAIL_RE.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? SUPABASE_ANON_KEY;

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: isLoggedIn ? undefined : email.trim(),
          page: location.pathname,
          access_code: readAccessCode(),
          user_agent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
      setStatus('success');
      onSuccess?.();
    } catch {
      setStatus('error');
      setErrorMsg(
        'Something went wrong sending your message. Please try again, or email sjoerd@cairnly.io directly.',
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Thanks, message sent</h3>
        <p className="text-sm text-muted-foreground">
          We'll get back to you by email soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="support-category">What's this about?</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="support-category" className="mt-1.5">
            <SelectValue placeholder="Pick a topic" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoggedIn && (
        <div>
          <Label htmlFor="support-email">Your email</Label>
          <Input
            id="support-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>
      )}

      <div>
        <Label htmlFor="support-message">Message</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
          placeholder={
            isBug
              ? "Tell us what went wrong, and we'll match it up with our error logs."
              : 'How can we help?'
          }
          rows={5}
          className="mt-1.5"
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <Button type="submit" className="w-full" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send message'}
      </Button>
    </form>
  );
};

export default SupportForm;
