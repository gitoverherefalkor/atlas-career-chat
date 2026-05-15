# Support & Feedback Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken "Contact support" links and the placeholder `/support` page with one reusable Support & Feedback form, reachable from a floating button post-login and from existing contextual links, that logs each request and emails sjoerd@cairnly.io.

**Architecture:** A single `SupportForm` React component is mounted two ways: inside a `SupportDialog` modal (opened by a global floating `SupportButton` and by the existing contextual links) and embedded directly on the `/support` page. Submissions POST to a new `submit-support-request` Supabase edge function, which inserts a row into a new `support_requests` table and sends an email via Resend.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind, shadcn/ui, react-router-dom, Supabase (Postgres + Deno edge functions), Resend.

**Note on verification:** this project has **no automated test framework** (no vitest/jest; `package.json` scripts are only dev/build/lint/preview). Verification in this plan therefore uses `npm run build` (compile/bundle check) and the browser preview, consistent with how the codebase is currently verified. Do not add a test framework.

---

## File Structure

**Create:**
- `supabase/migrations/20260515145300_create_support_requests.sql` — the `support_requests` table + RLS
- `supabase/functions/submit-support-request/index.ts` — edge function: validate, log, email
- `src/components/support/SupportForm.tsx` — the form (used by modal and page)
- `src/components/support/SupportDialog.tsx` — modal wrapper around `SupportForm`
- `src/components/support/SupportButton.tsx` — global floating button (post-login)

**Modify:**
- `supabase/config.toml` — add `[functions.submit-support-request]` with `verify_jwt = false`
- `src/App.tsx` — render `<SupportButton />` globally
- `src/pages/Support.tsx` — replace placeholder text with `<SupportForm />`
- `src/components/survey/AssessmentWelcome.tsx` — wire "Contact support" to open the dialog
- `src/components/dashboard/AccessCodeModal.tsx` — wire "Contact support" to open the dialog
- `src/components/survey/AccessCodeVerification.tsx` — wire "Contact support" to open the dialog

---

## Task 1: Database migration — `support_requests` table

**Files:**
- Create: `supabase/migrations/20260515145300_create_support_requests.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Support & Feedback requests submitted through the in-app form.
-- Written and read only by the submit-support-request edge function, which
-- uses the service role. RLS is enabled with no policies, making the table
-- service-role-only: the frontend anon key cannot read or write it.

CREATE TABLE IF NOT EXISTS public.support_requests (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   timestamptz NOT NULL DEFAULT now(),
    category     text NOT NULL,
    message      text NOT NULL,
    email        text NOT NULL,
    user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    page         text,
    access_code  text,
    user_agent   text,
    status       text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS support_requests_created_at_idx
    ON public.support_requests (created_at DESC);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260515145300_create_support_requests.sql
git commit -m "Add support_requests table migration"
```

The migration is applied to the database in Task 8.

---

## Task 2: Edge function — `submit-support-request`

**Files:**
- Create: `supabase/functions/submit-support-request/index.ts`
- Modify: `supabase/config.toml` (append a function block)

- [ ] **Step 1: Create the edge function**

```typescript
// submit-support-request — receives a Support & Feedback form submission,
// logs it to the support_requests table, and emails sjoerd@cairnly.io.
//
// Callable without authentication: pre-login users submit too. When a valid
// user session token is supplied, the user is derived from it server-side; a
// client-supplied user_id is never trusted.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import {
  getCorsHeaders,
  handleCorsPreFlight,
  errorResponse,
  checkRateLimit,
} from '../_shared/cors.ts';

const CATEGORY_LABELS: Record<string, string> = {
  access_code_payment: 'Access code / payment',
  assessment_survey: 'Assessment / survey',
  ai_chat: 'AI Chat',
  my_report: 'My report',
  job_openings: 'Job openings',
  account_login: 'Account / login',
  feature_idea: 'Feature idea',
  bug_report: 'Bug report',
  something_else: 'Something else',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SupportPayload {
  category?: string;
  message?: string;
  email?: string;
  page?: string;
  access_code?: string;
  user_agent?: string;
}

// Resolve the user from the request's auth token, if any. Returns null for
// anonymous requests. When logged out the frontend sends the anon key as the
// bearer token; /auth/v1/user rejects it, which we treat as anonymous (not an
// error).
async function resolveUser(
  req: Request,
): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!res.ok) return null;
    const user = await res.json().catch(() => null);
    if (!user?.id || typeof user.id !== 'string') return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  // Abuse guard: 5 submissions per minute per IP.
  const limited = checkRateLimit(req, 5, corsHeaders);
  if (limited) return limited;

  let body: SupportPayload;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400, corsHeaders);
  }

  const category = typeof body.category === 'string' ? body.category : '';
  if (!CATEGORY_LABELS[category]) {
    return errorResponse('Valid category required', 400, corsHeaders);
  }

  const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
  if (rawMessage.length === 0) {
    return errorResponse('Message required', 400, corsHeaders);
  }
  const message = rawMessage.slice(0, 5000);

  const authedUser = await resolveUser(req);

  // Email: from the session when logged in, otherwise from the body.
  let email = authedUser?.email ?? '';
  if (!email) {
    email = typeof body.email === 'string' ? body.email.trim() : '';
  }
  if (!EMAIL_RE.test(email)) {
    return errorResponse('Valid email required', 400, corsHeaders);
  }

  const page = typeof body.page === 'string' ? body.page.slice(0, 300) : null;
  const accessCode =
    typeof body.access_code === 'string' ? body.access_code.slice(0, 100) : null;
  const userAgent =
    typeof body.user_agent === 'string' ? body.user_agent.slice(0, 500) : null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Log first — if the email send fails afterward, the request is still saved.
  const { error: insErr } = await supabase.from('support_requests').insert({
    category,
    message,
    email,
    user_id: authedUser?.id ?? null,
    page,
    access_code: accessCode,
    user_agent: userAgent,
  });

  if (insErr) {
    console.error('[submit-support-request] insert error:', insErr);
    return errorResponse('Failed to submit request', 500, corsHeaders);
  }

  // Email notification. A failure here does not fail the request — the row is
  // already saved — but it is logged for follow-up.
  const categoryLabel = CATEGORY_LABELS[category];
  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    await resend.emails.send({
      from: 'Cairnly <no-reply@cairnly.io>',
      to: ['sjoerd@cairnly.io'],
      reply_to: email,
      subject: `[Support: ${categoryLabel}] from ${email}`,
      text: [
        `Category: ${categoryLabel}`,
        `From: ${email}`,
        `Account: ${authedUser ? authedUser.id : 'not logged in'}`,
        `Page: ${page ?? 'unknown'}`,
        `Access code: ${accessCode ?? 'none'}`,
        `Submitted: ${new Date().toISOString()}`,
        `Browser: ${userAgent ?? 'unknown'}`,
        '',
        '--- Message ---',
        message,
      ].join('\n'),
    });
  } catch (e) {
    console.error('[submit-support-request] email send failed:', e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Register the function as public in `supabase/config.toml`**

Append this block to the end of `supabase/config.toml` (it must be public because pre-login users call it):

```toml
[functions.submit-support-request]
verify_jwt = false
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/submit-support-request/index.ts supabase/config.toml
git commit -m "Add submit-support-request edge function"
```

The function is deployed in Task 8.

---

## Task 3: `SupportForm` component

**Files:**
- Create: `src/components/support/SupportForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/support/SupportForm.tsx
git commit -m "Add SupportForm component"
```

---

## Task 4: `SupportDialog` component

**Files:**
- Create: `src/components/support/SupportDialog.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no TypeScript errors. (If `DialogDescription` is not exported by `src/components/ui/dialog.tsx`, add it to that file's exports using the same pattern as the other Dialog exports.)

- [ ] **Step 3: Commit**

```bash
git add src/components/support/SupportDialog.tsx
git commit -m "Add SupportDialog modal wrapper"
```

---

## Task 5: `SupportButton` floating button + global mount

**Files:**
- Create: `src/components/support/SupportButton.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the floating button**

```tsx
import React, { useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SupportDialog from './SupportDialog';

// Floating Support & Feedback button. Renders only when a user is logged in.
const SupportButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Support and feedback"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-atlas-teal px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-atlas-teal/90 transition-colors"
      >
        <LifeBuoy className="h-4 w-4" />
        Support
      </button>
      <SupportDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default SupportButton;
```

- [ ] **Step 2: Mount it globally in `src/App.tsx`**

Add this import alongside the other eager component imports near the top of `src/App.tsx` (next to `import CookieConsentBanner from "./components/CookieConsentBanner";`):

```tsx
import SupportButton from "./components/support/SupportButton";
```

Then, in the JSX, render `<SupportButton />` immediately after `<CookieConsentBanner />` so it sits inside `<BrowserRouter>` (required — `SupportForm` uses `useLocation`):

```tsx
          </ChunkLoadErrorBoundary>
          <CookieConsentBanner />
          <SupportButton />
        </BrowserRouter>
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no TypeScript errors.

- [ ] **Step 4: Verify in the browser**

Start the preview (`preview_start`), open the app, and sign in. Confirm:
- The floating "Support" button appears bottom-right on a post-login page (e.g. `/dashboard`).
- It does NOT appear when logged out (e.g. `/` or `/auth`).
- Clicking it opens the Support & Feedback modal.
- On `/chat`, check the button does not block the chat input box; if it overlaps, note it for a follow-up (acceptable for this build).

- [ ] **Step 5: Commit**

```bash
git add src/components/support/SupportButton.tsx src/App.tsx
git commit -m "Add global floating SupportButton"
```

---

## Task 6: Replace the `/support` page placeholder

**Files:**
- Modify: `src/pages/Support.tsx`

- [ ] **Step 1: Replace the placeholder content with the form**

Replace the entire body of `src/pages/Support.tsx` with:

```tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupportForm from '@/components/support/SupportForm';

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-atlas-navy mb-6">Support</h1>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed mb-6">
            Questions, problems, or ideas? Send us a message and we'll get back
            to you by email.
          </p>
          <SupportForm />
        </div>
      </div>
    </div>
  );
};

export default Support;
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Verify in the browser**

In the preview, navigate to `/support`. Confirm the page shows the form (category dropdown, message box, and Send button), not the old placeholder text.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Support.tsx
git commit -m "Replace Support page placeholder with SupportForm"
```

---

## Task 7: Wire the contextual "Contact support" links

Each of three files has a dead "Contact support" link. For each, add dialog state, render `SupportDialog`, and turn the text into a button.

**Files:**
- Modify: `src/components/survey/AssessmentWelcome.tsx`
- Modify: `src/components/dashboard/AccessCodeModal.tsx`
- Modify: `src/components/survey/AccessCodeVerification.tsx`

- [ ] **Step 1: `AssessmentWelcome.tsx` — add the import**

At the top of `src/components/survey/AssessmentWelcome.tsx`, add after the existing imports:

```tsx
import SupportDialog from '@/components/support/SupportDialog';
```

- [ ] **Step 2: `AssessmentWelcome.tsx` — add dialog state**

Inside the `AssessmentWelcome` component body, alongside its other `useState` calls, add:

```tsx
  const [supportOpen, setSupportOpen] = useState(false);
```

- [ ] **Step 3: `AssessmentWelcome.tsx` — replace the help block**

Find this block:

```tsx
            {/* Help Section */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Having trouble? Contact support or{' '}
                <button 
                  onClick={() => navigate('/')}
                  className="text-atlas-blue hover:underline font-medium"
                >
                  return to homepage
                </button>
              </p>
            </div>
```

Replace it with:

```tsx
            {/* Help Section */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Having trouble?{' '}
                <button
                  onClick={() => setSupportOpen(true)}
                  className="text-atlas-blue hover:underline font-medium"
                >
                  Contact support
                </button>{' '}
                or{' '}
                <button
                  onClick={() => navigate('/')}
                  className="text-atlas-blue hover:underline font-medium"
                >
                  return to homepage
                </button>
              </p>
            </div>
            <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
```

- [ ] **Step 4: `AccessCodeVerification.tsx` — add the import**

At the top of `src/components/survey/AccessCodeVerification.tsx`, add after the existing imports:

```tsx
import SupportDialog from '@/components/support/SupportDialog';
```

- [ ] **Step 5: `AccessCodeVerification.tsx` — add dialog state**

Inside the `AccessCodeVerification` component body, alongside its other `useState` calls, add:

```tsx
  const [supportOpen, setSupportOpen] = useState(false);
```

- [ ] **Step 6: `AccessCodeVerification.tsx` — replace the help block**

Find this block:

```tsx
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Having trouble? Contact support or{' '}
              <button 
                onClick={() => navigate('/')}
                className="text-atlas-blue hover:underline"
              >
                return to homepage
              </button>
            </p>
          </div>
```

Replace it with:

```tsx
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Having trouble?{' '}
              <button
                onClick={() => setSupportOpen(true)}
                className="text-atlas-blue hover:underline"
              >
                Contact support
              </button>{' '}
              or{' '}
              <button
                onClick={() => navigate('/')}
                className="text-atlas-blue hover:underline"
              >
                return to homepage
              </button>
            </p>
          </div>
          <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
```

- [ ] **Step 7: `AccessCodeModal.tsx` — add the import**

At the top of `src/components/dashboard/AccessCodeModal.tsx`, add after the existing imports:

```tsx
import SupportDialog from '@/components/support/SupportDialog';
```

- [ ] **Step 8: `AccessCodeModal.tsx` — add dialog state**

Inside the `AccessCodeModal` component body, alongside its other `useState` calls, add:

```tsx
  const [supportOpen, setSupportOpen] = useState(false);
```

- [ ] **Step 9: `AccessCodeModal.tsx` — replace the help block**

Find this block:

```tsx
          {/* Help Section */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Having trouble?{' '}
              <button
                onClick={onClose}
                className="text-atlas-blue hover:underline font-medium"
              >
                Contact support
              </button>
            </p>
          </div>
```

Replace it with:

```tsx
          {/* Help Section */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Having trouble?{' '}
              <button
                onClick={() => setSupportOpen(true)}
                className="text-atlas-blue hover:underline font-medium"
              >
                Contact support
              </button>
            </p>
          </div>
          <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
```

- [ ] **Step 10: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no TypeScript errors.

- [ ] **Step 11: Verify in the browser**

In the preview, open the "Ready to Begin" / access-code screens and confirm clicking "Contact support" opens the Support & Feedback modal (with the email field shown, since these can be pre-login).

- [ ] **Step 12: Commit**

```bash
git add src/components/survey/AssessmentWelcome.tsx src/components/dashboard/AccessCodeModal.tsx src/components/survey/AccessCodeVerification.tsx
git commit -m "Wire Contact support links to the Support dialog"
```

---

## Task 8: Deploy and end-to-end verify

The frontend deploys automatically when `main` updates (GitHub to Vercel integration). The migration and edge function need separate deployment to Supabase. **These steps affect production — confirm with the user before running them.**

- [ ] **Step 1: Push the branch to `main`**

```bash
git push origin HEAD:main
```

This triggers the Vercel production deploy of the frontend. Do not run `vercel --prod` manually.

- [ ] **Step 2: Apply the database migration**

Apply `supabase/migrations/20260515145300_create_support_requests.sql` to the production database, using whichever method the project uses for migrations (Supabase CLI `supabase db push`, or the Supabase MCP `apply_migration` tool). Confirm the `support_requests` table exists afterward.

- [ ] **Step 3: Deploy the edge function**

Deploy `submit-support-request` to Supabase (Supabase CLI `supabase functions deploy submit-support-request`, or the project's existing function-deploy mechanism). No new secrets are required: `RESEND_API_KEY` is already configured for the other email functions, and `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

- [ ] **Step 4: End-to-end verification**

On production:
- Sign in, click the floating "Support" button, pick a category, type a message, and submit.
- Confirm the success state ("Thanks, message sent") appears.
- Confirm an email arrives at sjoerd@cairnly.io with the category in the subject and reply-to set to the submitter.
- Confirm a row was inserted into `support_requests` with the message and captured context (page, user_id, user_agent).
- Submit once while logged out via a contextual "Contact support" link, providing an email, and confirm it also arrives and logs.

---

## Self-Review

**Spec coverage:**
- Reusable `SupportForm` used in modal and page — Tasks 3, 4, 6. ✓
- Floating `SupportButton` post-login — Task 5. ✓
- `SupportDialog` modal — Task 4. ✓
- Contextual links wired — Task 7. ✓
- `/support` page replaces placeholder — Task 6. ✓
- Category list (9 options incl. AI Chat, Job openings) — Task 3 `SUPPORT_CATEGORIES` and Task 2 `CATEGORY_LABELS`. ✓
- Auto-captured context (page, user, access code, user agent, timestamp) — Task 3 (collection) + Task 2 (timestamp added server-side, all stored). ✓
- `support_requests` table + RLS locked down — Task 1. ✓
- `submit-support-request` edge function: insert + Resend email, reply-to — Task 2. ✓
- Function callable unauthenticated (`verify_jwt = false`), user derived server-side — Task 2. ✓
- Error handling: validation, keep message on failure, log-before-email — Tasks 2 & 3. ✓
- Success state — Task 3. ✓
- Pre-login email field shown — Task 3 (`!isLoggedIn`). ✓
- Bug reports lean on Sentry, friendly line, no buffer/upload — Task 3 (`isBug` placeholder). ✓
- `/chat` overlap noted — Task 5 Step 4. ✓

**Placeholder scan:** No TBD/TODO; all code blocks are complete.

**Type consistency:** `SupportForm` props (`onSuccess?`), `SupportDialog` props (`open`, `onOpenChange`), and category `value` strings match between Task 2 (`CATEGORY_LABELS` keys) and Task 3 (`SUPPORT_CATEGORIES` values). The edge function payload fields (`category`, `message`, `email`, `page`, `access_code`, `user_agent`) match what `SupportForm` sends.
