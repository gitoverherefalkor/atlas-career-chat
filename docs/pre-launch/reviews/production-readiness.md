# Atlas Assessments / Cairnly — Launch Readiness Review

Read-only pass for a paid, AI-driven career assessment shipping on Vercel + Supabase + n8n.cloud + Stripe + Resend. Domain is `cairnly.io`.

## Strengths (already done well)

- **Strong vercel.json security headers.** CSP is narrow (whitelisted Stripe, Supabase, n8n hosts), HSTS with 2-year max-age + preload, X-Frame-Options DENY, Permissions-Policy locked down.
- **Stripe webhook signature verification exists** (`supabase/functions/payment-success/index.ts` lines 108–128).
- **n8n callbacks have shared-secret auth** (`_shared/cors.ts:verifySharedSecret`) — used by `analysis-completed`, `chat-session-complete`, `deliver-section`.
- **Rate limiting present** on the high-risk endpoints.
- **CORS is origin-locked** to cairnly.io / www.cairnly.io (+localhost). No `*`.
- **GDPR endpoints exist and are auth-gated** (`delete-user-data`, `export-user-data`) with `verify_jwt = true` in config.toml.
- **Cookie consent banner present.** Essential-only by default.
- **Privacy/Cookie/Terms pages exist** and are routed.
- **Reminder emails have a "stop these reminders" link** pointing to Profile Settings.
- **ChunkLoadErrorBoundary** handles stale-bundle-after-deploy reloads.
- **n8n forward retries on 5xx** with 30s back-off.
- **Access codes use `crypto.getRandomValues`**, not Math.random.
- **No analytics SDK at all.** Privacy win, observability hole.

## Critical (will blow up day 1)

### C1. Zero error monitoring on the frontend
**Where:** `src/main.tsx`, `src/App.tsx`. No Sentry, no window.onerror, no unhandledrejection handler. Only a `ChunkLoadErrorBoundary` for stale-chunk recovery.

**Failure scenario:** First paying user hits an edge case in `Chat.tsx` or `Report.tsx`. Page goes white. You have no stack trace.

**Fix:** Wire Sentry (`@sentry/react`) with `tracesSampleRate: 0.1` and `replaysOnErrorSampleRate: 1.0`. Wrap `<App />` in a generic ErrorBoundary.

### C2. n8n Error Handler workflow does not surface to the user
**Where:** `forward-to-n8n/index.ts` marks the report row `status='failed'`. `ReportProcessing.tsx` correctly handles `failed` phase. BUT: n8n's internal Error Handler workflow only emails admin. If WF2/WF3/WF4 errors *mid-pipeline*, the report sits at `status='processing'` forever.

**Fix:** Make the n8n Error Handler workflow update `reports.status='failed'` on any pipeline failure.

### C3. VITE_N8N_CHAT_WEBHOOK_URL and VITE_N8N_RESUME_WEBHOOK_URL are baked into the bundle and unauthenticated
**Where:** `.env`, `src/hooks/useN8nWebhook.ts:19`.

**Fix (proper):** Route chat through a Supabase edge function (`/functions/v1/chat-proxy`) that authenticates the user JWT, rate-limits, then calls n8n with an `x-shared-secret` header n8n verifies.

**Fix (interim):** Add Header Auth on the n8n webhook trigger node and a hard rate limit on n8n side.

### C4. Edge function logging is unstructured and lossy
**Where:** Every function uses `console.log/error` with ad-hoc strings. No request ID, no user ID correlation, no duration.

**Fix:** Standardize a tiny `log(level, msg, meta)` helper in `_shared/cors.ts` that emits JSON `{ts, level, fn, request_id, user_id, msg, ...}`.

### C5. `N8N_SHARED_SECRET` silently no-ops if unset
**Where:** `_shared/cors.ts:44-50`.

**Failure scenario:** You forget to set the secret on the production project. Attacker discovers the function URLs and marks arbitrary reports as `pending_review`.

**Fix:** Hard-fail (return 500) if `N8N_SHARED_SECRET` is unset in production.

### C6. Stripe webhook fallback path is the soft underbelly
**Where:** `payment-success/index.ts:130-138`.

**Fix:** Make the frontend-driven path require the user JWT and check the JWT's email matches `session.customer_details.email`. Or eliminate it.

### C7. Several `public` schema tables have RLS disabled
**Where:** `docs/SUPABASE_RLS_FIXES.md` (still open). `enriched_jobs`, `sop_vectors`, `prompts`, `api_error_logs`, `error_logs`.

**Fix:** Run the migrations in `docs/SUPABASE_RLS_FIXES.md` before launch.

### C8. `parse-resume` legacy function has no rate limit and verbose error responses
**Fix:** Add `checkRateLimit(req, 5, corsHeaders)`. Strip the `debug{}` block from error response. Cap input file size before parsing. Or just delete this function.

## Important (fix in first week)

### I1. Email reminders have no per-user unsubscribe — only a "go to Profile Settings" link
**Fix:** Add `List-Unsubscribe` headers. Build a `/unsubscribe` route.

### I2. Email plain-text fallback missing
All Resend calls send `html` only, no `text`. **Fix:** Add a `text` field with a basic plain-text version.

### I3. Access-code lookup is case-flexible but stored case-sensitive
Ensure DB stores in canonical form (uppercase).

### I4. `parse-resume-ai` rate limit is per-IP
Corporate NAT hits 5/min and gets 429s. **Fix:** Layer rate limits — IP + authenticated user_id.

### I5. In-memory rate limiter is per-function-instance
Documented in code. Move to Postgres counter or Upstash Redis for real abuse protection.

### I6. `parse-resume` and `parse-resume-ai` both exist
Verify which is canonical and remove the other.

### I7. `forward-to-n8n` is not auth-gated
**Fix:** Set `verify_jwt = true` and read `user_id` from the JWT.

### I8. `delete-user-data` does not clear `n8n_chat_histories` or `chat_highlights`
**Fix:** Add deletes for `n8n_chat_histories WHERE session_id IN (report_ids)` and `chat_highlights WHERE report_id IN (...)`.

### I9. `export-user-data` returns 200 even when sub-queries silently fail
**Fix:** Surface partial-export warnings to the user.

### I10. No "graceful degradation" copy for n8n outage
**Fix:** Add a `system_status` row in DB or a static `/api/status` endpoint.

### I11. From-address `no-reply@cairnly.io` blocks two-way email
Better: `hello@cairnly.io` or `support@cairnly.io` + Reply-To.

### I12. CSP allows `https://cdnjs.cloudflare.com` for scripts
If unused, drop it.

## Minor / nice-to-have

- **M1.** `tts` cache header is `no-store`. Audio is identical for identical (text, voice) — could cache per-content-hash and save OpenAI cents.
- **M2.** `payment-success` hard-codes `survey_type: 'Office / Business Pro - 2025 v1 EN'` — fine for v1, flag for future.
- **M3.** Console.log warning that `N8N_SHARED_SECRET not set` is the only signal that auth is disabled. Easy to miss.
- **M4.** `auth-callback` redirect target uses `FRONTEND_URL` env var with fallback to `https://www.cairnly.io`. Verify it's set in prod.
- **M5.** `index.html` `theme-init.js` is an external script — make sure the file is small and cached.
- **M6.** Reminder emails footer mentions "© 2026" hard-coded.
- **M7.** Share-card image is a placeholder — produce a real 1200×630 OG image.
- **M8.** `Cache-Control` headers absent from `vercel.json`.

## Pre-launch ops checklist (concrete, ordered)

1. **Set `N8N_SHARED_SECRET`** in Supabase project env (production). Verify with a `curl -X POST` to `chat-session-complete` without the header → 401.
2. **Set `STRIPE_WEBHOOK_SECRET`** in Supabase env. Register the webhook in Stripe dashboard. Test in Stripe's CLI: `stripe trigger checkout.session.completed`.
3. **Run RLS migrations** from `docs/SUPABASE_RLS_FIXES.md`. Verify with anon-key cURL on each table.
4. **Wire Sentry** on the frontend (`@sentry/react`). Wrap `<App />` in a generic ErrorBoundary. Add Sentry env vars in Vercel.
5. **Enable Supabase PITR backups** (Pro plan or higher). Schedule a monthly restore drill.
6. **Verify DNS:** cairnly.io and www.cairnly.io both A/AAAA → Vercel; SPF, DKIM, DMARC records for Resend on `cairnly.io`. Send yourself a test from no-reply and inspect headers.
7. **Verify Stripe is in live mode** and `STRIPE_SECRET_KEY` in Supabase points to `sk_live_…`. Do one €1 real-money e2e purchase as a final smoke test.
8. **Seed at least one access code manually** so you can run the e2e walk without paying.
9. **Walk the full path once with fresh creds.**
10. **Test failure modes:** kill n8n WF1 (deactivate), submit assessment, confirm `failed` status surfaces correctly.
11. **Test Stripe webhook replay:** verify idempotency. Add `ON CONFLICT (stripe_session_id) DO NOTHING` on `purchases` insert.
12. **Set up budget alerts:** OpenAI dashboard monthly cap, Stripe high-payment-failure-rate alert, Supabase DB size and edge-function-invocation alerts, n8n.cloud execution-quota alert.
13. **Confirm Resend domain verification.**
14. **Set Vercel env vars** for every var the bundle reads, and every var the edge functions read in Supabase.
15. **Vercel project copy:** confirm `.vercel/project.json` is set.
16. **Disable the `parse-resume` legacy function** if not used, or rate-limit + size-cap it.
17. **Lock the n8n webhook trigger nodes** to require a Header Auth credential.
18. **Test GDPR delete on a throwaway account.**
19. **Schedule a 30-min smoke check 1 hour after launch announcement.**

## First-72-hours monitoring plan

**Continuously open in tabs / dashboards:**
- Sentry — Issues feed.
- Stripe dashboard — Payments + Webhooks.
- Supabase → Functions → Logs.
- n8n.cloud → Executions, filter "failed".
- Resend → Activity.
- Vercel → Analytics + Deployments.

**Hourly first 6 hours, then 4-hourly:**
- `SELECT status, count(*) FROM reports WHERE created_at > now() - interval '6 hour' GROUP BY 1`
- Reconcile `purchases` count against Stripe.
- OpenAI usage dashboard.

**Hard kill criteria — pull the launch banner if any of these:**
- Webhook signature failures > 0 sustained.
- > 5% of reports stuck in `processing` after 10 min.
- Resend bounce rate > 3% or complaint rate > 0.3%.
- Any unhandled Sentry error > 10 occurrences in 1 hour.
- Supabase function 5xx rate > 2%.

**Bottom line:** Foundationally in better shape than most "vibe-coded" pre-launch products. Fix C1 (Sentry) and C5 (N8N_SHARED_SECRET fail-closed) before turning on real-money traffic. C3 is the lurking cost-burn risk.
