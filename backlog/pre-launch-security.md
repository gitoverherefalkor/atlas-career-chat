# Pre-Launch Security & Performance Backlog

Items to address before going live. Tackle these once feature development is complete and n8n workflows are finalized.

---

## CRITICAL — Must fix before launch

### 1. Lock down CORS on all edge functions
**Files:** All functions in `supabase/functions/`
**Current:** `Access-Control-Allow-Origin: '*'` on every function
**Fix:** Restrict to `https://atlas-assessments.com` (and `http://localhost:*` for dev)
**Why:** Any website can currently call your payment, survey, and report endpoints

### 2. Add Stripe webhook signature verification
**File:** `supabase/functions/payment-success/index.ts`
**Current:** Trusts any caller who provides a valid Stripe session ID
**Fix:** Use `stripe.webhooks.constructEvent()` with webhook signing secret to verify requests actually come from Stripe
**Why:** Without this, someone could call the endpoint directly and get a free access code

### 3. Fix session tokens exposed in URL
**Files:** `supabase/functions/auth-callback/index.ts`, `src/pages/AuthConfirm.tsx`
**Current:** Full session (incl. access tokens) is base64-encoded in the redirect URL
**Fix:** Use PKCE flow or short-lived auth codes that are exchanged server-side
**Why:** Tokens visible in browser history, server logs, referrer headers

---

## HIGH — Should fix before launch

### 4. Add auth checks to n8n-facing edge functions
**Files:** `forward-to-n8n`, `store-report-sections`, `analysis-completed`, `chat-session-complete`
**Current:** No JWT or shared secret validation
**Fix:** For user-facing functions: validate JWT from auth header. For n8n callbacks: validate a shared secret header
**Why:** Anyone can call these endpoints with arbitrary user_id/report_id
**Note:** Wait for n8n workflow JSONs to design the shared secret approach

### 5. Add rate limiting to sensitive endpoints
**Files:** `verify-access-code`, `parse-resume-ai`, `create-checkout`
**Current:** No rate limiting — unlimited attempts allowed
**Fix:** Implement per-IP rate limiting (e.g., 10 verify attempts/minute, 5 resume parses/hour)
**Why:** Access code brute-forcing, API cost abuse on Gemini
**Options:** Supabase edge function middleware, Cloudflare rate limiting, or custom Redis-based limiter

### 6. Sanitize error responses
**Files:** `store-report-sections`, `parse-resume-ai`, `payment-success`
**Current:** Some errors return internal details (`error.message`, database errors)
**Fix:** Log full errors server-side, return generic messages to clients
**Why:** Exposes database schema and API internals to potential attackers

---

## MEDIUM — Fix soon after launch

### 7. Add Content Security Policy headers
**Current:** No CSP headers configured
**Fix:** Add CSP headers via Vite config or meta tag:
```
default-src 'self'; script-src 'self' https://cdn.n8n.io; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com data:;
```
**Why:** Defense-in-depth against XSS

### 8. Replace 3-second polling with Supabase Realtime
**File:** `src/pages/Chat.tsx` (line ~178)
**Current:** Polls report status every 3 seconds (1,200 calls/hour per user)
**Fix:** Use `supabase.channel('report-status').on('postgres_changes', ...)`
**Why:** Unnecessary API load, especially if users leave tab open

### 9. Optimize survey data loading
**File:** `src/hooks/useSurvey.ts`
**Current:** 3 sequential queries (surveys -> sections -> questions)
**Fix:** Use a single joined query or RPC function
**Why:** 3 round-trips where 1 would do, adds ~500ms latency

### 10. Validate n8n webhook URL at runtime
**File:** `supabase/functions/forward-to-n8n/index.ts`
**Current:** Fetches and POSTs to N8N_WEBHOOK_URL without URL validation
**Fix:** Validate URL domain matches expected n8n host before sending data
**Why:** If env var is compromised, survey data could be exfiltrated

---

## Completed (this session)

- [x] ~~Strip sensitive console.log statements from edge functions~~ (forward-to-n8n, payment-success, send-confirmation-email, chat-session-complete)
- [x] ~~Replace Math.random() with crypto.getRandomValues()~~ (payment-success access code generation)
- [x] ~~Convert 3.4MB PNGs to WebP~~ (about_you.png, career_suggestions.png -> 98% smaller)
- [x] ~~Add DOMPurify XSS protection~~ (QuestionRenderer.tsx, Chat.tsx)
- [x] ~~Add React.lazy() route splitting~~ (App.tsx - 14 lazy-loaded routes)
