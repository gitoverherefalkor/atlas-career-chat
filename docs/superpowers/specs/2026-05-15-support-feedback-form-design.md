# Support & Feedback Form — Design

Date: 2026-05-15
Status: Approved (design)

## Goal

Replace the broken/placeholder support touchpoints with one real, low-friction
Support & Feedback form. A logged-in user can reach it from any page; the form
auto-captures context, logs the request, and emails sjoerd@cairnly.io.

## Background — current state

- The `/support` page ([src/pages/Support.tsx](../../../src/pages/Support.tsx)) is a placeholder with filler text.
- "Contact support" links are dead: plain non-clickable text in
  `AssessmentWelcome.tsx`, and a no-op (just closes the modal) in
  `AccessCodeModal.tsx`. `AccessCodeVerification.tsx` has the same plain text.
- Email infrastructure already exists: Resend, sending from `cairnly.io`
  (see `supabase/functions/send-confirmation-email`).
- A "form → edge function" pattern already exists (`submit-chapter-feedback`).
- Sentry is wired on the frontend and captures JavaScript errors.

## Approach

Approach A — a single reusable `SupportForm` component, mounted both inside a
modal and embedded on the `/support` page, so the modal and the page are
literally the same form. Chosen over a page-redirect approach because the modal
keeps users in their flow and reads context live from the session.

## Components (new, under `src/components/support/`)

- **`SupportForm`** — the form itself:
  - "What's this about?" category dropdown (required)
  - Message textarea (required, capped at ~5,000 chars)
  - Email field — shown and required ONLY when there is no logged-in session;
    when logged in, the email is taken from the session and not shown
  - Submit → calls the edge function; renders idle / submitting / success /
    error states
- **`SupportDialog`** — shadcn `Dialog` wrapper around `SupportForm`, with
  controlled open/close. Opening it never navigates away.
- **`SupportButton`** — small fixed-position floating button (bottom-right),
  rendered only on post-login pages. Opens `SupportDialog`.

## Wiring existing touchpoints

- The "Contact support" text in `AssessmentWelcome.tsx`, `AccessCodeModal.tsx`,
  and `AccessCodeVerification.tsx` becomes a button that opens `SupportDialog`.
  These can be pre-login, so the form shows its email field there.
- `/support` page: replace the placeholder content with `SupportForm` embedded
  in the existing page layout (header + back button kept).

## Category dropdown options

Access code / payment · Assessment / survey · AI Chat · My report ·
Job openings · Account / login · Feature idea · Bug report · Something else

("Job openings" matches the `/jobs` page heading "Find Job Openings".)

## Context captured automatically (not typed by the user)

- Current page / route path
- User ID + email (from the Supabase session, if logged in)
- Access code (from URL params or `purchase_data` in localStorage, if present)
- Browser / device user-agent
- Timestamp

## Data layer

### `support_requests` table (new migration)

Columns: `id` (uuid pk) · `created_at` (timestamptz default now()) ·
`category` (text) · `message` (text) · `email` (text) · `user_id` (uuid,
nullable) · `page` (text) · `access_code` (text, nullable) ·
`user_agent` (text, nullable) · `status` (text, default `new`).

`status` (new / in_progress / resolved) exists only for a future admin view;
it is not used in this build.

RLS: enabled, locked down. Writes/reads happen only via the edge function
using the service role. No anon/authenticated access.

### `submit-support-request` edge function (new)

1. Validates payload (category + message required; email required when no
   `user_id`).
2. Inserts a row into `support_requests` (service role).
3. Sends an email via Resend:
   - from: `Cairnly <no-reply@cairnly.io>`
   - to: `sjoerd@cairnly.io`
   - reply-to: the submitter's email (so a plain Reply reaches the user)
   - subject: `[Support: <category>] from <email>`
   - body: the message plus the captured context
4. CORS handled via the existing `_shared/cors.ts` pattern.

The function must accept unauthenticated calls (`verify_jwt = false`), because
pre-login users submit through it. It validates and sanitizes all input
server-side and never trusts a client-supplied `user_id` — when a session
token is present it derives the user from it, otherwise the request is treated
as anonymous.

## Error handling

- Validation: category + message required; message capped ~5,000 chars; when
  logged out, email required and format-validated.
- If the submission fails: the form shows an error but keeps the typed message,
  with a fallback line ("or email sjoerd@cairnly.io directly").
- If the DB insert succeeds but the email fails (or vice versa): the request is
  still logged, so the user sees success; the edge function records the failure
  rather than forcing a retry. Insert happens before the email send.
- Success state: a "Thanks — we'll get back to you soon" confirmation replaces
  the form (in both the modal and the page).

## Pre-login vs post-login

- The floating `SupportButton` appears only when there is an active session.
- Pre-login users reach the form through the existing "Contact support" links,
  which open `SupportDialog` with the email field shown.

## Bug reports & Sentry

No console instructions, no client-side error buffer, no screenshot upload.
Sentry already captures JavaScript errors with full stack traces and richer
context than a homegrown buffer could. The Bug report category shows a friendly
line ("Tell us what went wrong — we'll match it up with our error logs"); the
ticket's captured context (user, page, timestamp) is the bridge to find the
matching event in Sentry.

## Out of scope (YAGNI)

- Screenshot / file upload
- Client-side error buffer
- Admin dashboard for `support_requests`
- Confirmation email to the user
- Repositioning audit beyond the known `/chat` overlap note

## Known consideration

The `/chat` page has its own bottom input box; the floating button position
must avoid overlapping it (adjust placement, revisit once live).

## Verification plan

- Browser preview: floating button appears post-login; modal opens; validation
  works; success state shows; `/support` page renders the form; contextual
  links open the dialog.
- End-to-end: one real submission lands in sjoerd@cairnly.io AND appears as a
  row in `support_requests`.
