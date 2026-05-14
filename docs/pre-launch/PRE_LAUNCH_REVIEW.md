# Atlas Assessments — Consolidated Pre-Release Review

Five expert reviewers ran in parallel: Security, Data/n8n, Frontend/UX, Architecture, Production Readiness. Findings deduped and ranked by release impact. Where multiple reviewers independently flagged the same issue, it's marked with a confidence tag.

Individual reports live in `docs/pre-launch/reviews/`.

## Verdict

You're closer to launch-ready than most vibe-coded products. The foundation is good: locked-down CORS, strong CSP/HSTS in `vercel.json`, Stripe signature verification, GDPR endpoints, generated Supabase types, sensible lazy-routing, rate limits on the right endpoints, and a thoughtful UX in the survey and report-processing flow.

**But there are 5–6 issues that will hurt you on day 1 if you ship as-is.** Most are small fixes, hours not days. The biggest categories: (1) several edge functions trust client-provided `user_id`, (2) the n8n shared-secret fails open if unset, (3) the failure path of the n8n pipeline is silently broken, and (4) you have no error monitoring so you won't see day-1 problems.

---

## Strengths (real ones, keep these)

- Tight CSP + HSTS + X-Frame-Options in `vercel.json:11`. Above average for a launch.
- CORS origin allowlist in `supabase/functions/_shared/cors.ts:5-27`.
- Stripe webhook signature verification when configured: `payment-success/index.ts:107-128`.
- Rate limits on the high-risk endpoints (tts, signup, verify-access-code, create-checkout, parse-resume-ai).
- Cookie consent + privacy/cookie/terms pages routed, no tracking SDKs (privacy-respecting).
- Survey persistence is well-designed: UNIQUE on `answers(access_code_id)` + `status` CHECK + autosave upserts the draft row.
- `reports.status` has a CHECK constraint + index + pg_net trigger only on transition.
- Code-splitting with `ChunkLoadErrorBoundary` for post-deploy stale chunks.
- Domain-split component structure with colocated hooks.
- Generated Supabase types are present and current.
- Processing screen (`src/pages/ReportProcessing.tsx`) is one of the most polished surfaces in the app.

---

## Release Blockers (fix before opening signup)

### B1. `forward-to-n8n` trusts client-provided `user_id` — anyone can write reports under any user's account
*Security + Data + Production all flagged this*

`supabase/functions/forward-to-n8n/index.ts:31-46`. Service role + no JWT check. `verify_jwt = false` in `supabase/config.toml`.

**Fix:** verify JWT, derive `user_id` from `auth.getUser()`, drop body `user_id`/`user_email`. Same pattern as `delete-user-data/index.ts:14-31`.

### B2. `deliver-section`, `wrap-up-save`, `wrap-up-extract`, `submit-chapter-feedback`, `forward-resume-to-n8n` — all accept `user_id`/`report_id` from client with no auth
Same root cause. Attackers can poison another user's chat memory, overwrite chapter feedback, replay wrap-up generation (you pay OpenAI), or inject a resume under a victim's account that feeds their assessment.

**Fix:** same auth pattern — JWT → `auth.uid()` → `SELECT user_id FROM reports WHERE id = $report_id` ownership check before any write.

### B3. `N8N_SHARED_SECRET` fails open if unset
`_shared/cors.ts:44-50` — `verifySharedSecret` logs a warning and returns OK when the secret is unset. This protects `analysis-completed`, `chat-session-complete`, `deliver-section`. If you forget to set the env var in prod (very likely during a re-deploy), all three become public.

**Fix:** remove the graceful-degradation branch. Hard-fail if `N8N_SHARED_SECRET` is unset and `Deno.env.get('SUPABASE_ENV') === 'production'`.

### B4. Postgres trigger calling `analysis-completed` doesn't send the shared secret
`supabase/migrations/20250918090000-report-completed-trigger.sql:14-25` — `pg_net` call only sets Content-Type. So either (a) the secret is set and this trigger is silently broken (the "report ready" email never sends), or (b) the secret is unset and combined with B3 anyone can flip any report to `pending_review` and trigger emails.

**Fix:** read the secret from Vault (same pattern as `check_and_send_reminders`) and pass `x-shared-secret` in the headers.

### B5. `forward-to-n8n` writes `status='failed'` but that's not in the CHECK constraint
`forward-to-n8n/index.ts:78,94,148` writes `'failed'`. `migrations/20251007000000_add_report_status_enum.sql:18-20` only allows `processing | pending_review | completed`. Every failure path throws. Result: failed reports stay stuck in `processing` and `ReportProcessing.tsx:41-58` polls forever with no real failure surfaced.

**Fix:** add `'failed'` to the CHECK constraint via a new migration. One-line migration.

### B6. `usage_count` is double-incremented on every successful survey submission
`useSurveySubmission.ts:32-65` does read-then-increment. `useSurveyCompletion.ts:53-62` then re-increments from the stale value. Codes with `max_usage=1` become unverifiable after one submit. Also a race if user double-clicks across tabs.

**Fix:** delete one of the writers, make the survivor atomic: `UPDATE access_codes SET usage_count = usage_count + 1 WHERE id = $1`.

### B7. `signup-with-access-code` never increments `usage_count`
`signup-with-access-code/index.ts:97-117`. The increment happens only after survey submit (and twice — see B6). Between paying and submitting the survey, anyone with the code can register N accounts.

**Fix:** atomically mark the code consumed inside the edge function in the same transaction as user creation. Or bind code to `user_id` on first redemption.

### B8. RLS disabled on 5 tables — anon key in browser can read them
Per `docs/SUPABASE_RLS_FIXES.md`: `enriched_jobs`, `sop_vectors`, `prompts`, `api_error_logs`, `error_logs`. `prompts` leaks your system prompts (your moat). `error_logs`/`api_error_logs` leak PII from error messages.

**Fix:** apply the migrations already drafted in that doc. Verify with `curl` using the anon key.

### B9. `payment-success` fallback path is exploitable
`payment-success/index.ts:129-139` — if no `stripe-signature` header, falls back to "trust the body's sessionId". A leaked `cs_…` session ID (browser history, support screenshot, log leak) → free access code minted and emailed. Also no UNIQUE on `purchases.stripe_session_id` so duplicates can be created.

**Fix:** require webhook signature in prod. Add `UNIQUE` on `purchases.stripe_session_id`. The success page can poll the `purchases` table instead.

### B10. Chat + Resume n8n webhook URLs are in the bundle, unauthenticated
`useN8nWebhook.ts:19`. `VITE_N8N_CHAT_WEBHOOK_URL` is in plain JS. Anyone in devtools can POST arbitrary prompts to n8n's WF5 endpoint and burn your OpenAI credits unbounded.

**Fix (minimum):** add Header Auth on the n8n trigger node + rate-limit on n8n side, plus an OpenAI monthly budget cap as backstop.

**Fix (proper):** route chat through a Supabase edge function that auth-checks the user JWT, rate-limits per user, then calls n8n with `x-shared-secret`.

### B11. `wrap-up-extract` uses a model name that probably doesn't exist
`wrap-up-extract/index.ts:189` — `gpt-5.4-mini`. Verify this is real; if not, every end-of-chat wrap-up returns 502 and the user sees "Failed to generate highlights." Two-minute fix if it's a typo.

### B12. No frontend error monitoring
No Sentry, no `window.onerror`, no `unhandledrejection`. A blank-screen render error on day 1 reaches you only as a support email with no stack.

**Fix:** wire `@sentry/react`, wrap `<App />` in an ErrorBoundary that reports + shows a fallback. ~30 minutes.

---

## Should Fix Before Public Launch

### S1. Mixed service-role env var names across edge functions
*Architecture + Security flagged this*

8 functions use `SUPABASE_SERVICE_ROLE_KEY`, 6 use `NEW_N8N_SERVICE_ROLE_KEY`. Half-completed rotation. Rotate one and forget the other = half the app silently 500s. Pick one name, update Supabase secrets, search-replace.

### S2. No idempotency on n8n callbacks
`analysis-completed/index.ts:33-44` and `chat-session-complete/index.ts:37-45` blindly UPDATE without `.eq('status', <expected prior state>)`. n8n retries on transient errors = user gets two "report ready" emails. `wrap-up-save` does it right — copy that pattern.

### S3. No UNIQUE constraint on `reports(access_code_id)` or `purchases(stripe_session_id)`
A resubmit or webhook replay creates duplicate rows. The dashboard "latest by created_at" lottery picks the wrong report.

### S4. `aa_dead_letter_log` SELECT policy is `USING (true)` for any authenticated user
`migrations/20250620143019-…sql:24-27` — every signed-in user can read every error log, including payload snippets and other users' emails. Drop the policy or restrict to service_role.

### S5. `dark` class hardcoded on `<html>` to drive the editorial palette
`src/App.tsx:62-67`. This hijacks Tailwind's reserved `dark:` modifier. Result: every shadcn primitive that uses `dark:` variants gets unintended styling, and downstream components compensate with hardcoded hex like `text-[#F5F5F5]` in `Dashboard.tsx:345`. 143 hardcoded hex codes across `src/`. **Fix:** rename the class (`.atlas-editorial`) so it's decoupled from Tailwind's dark-mode hook.

### S6. i18n is half-built
`src/i18n.ts:28-30` declares `supportedLngs: ['en']` only but Dutch files exist in `public/locales/nl/` and 4 components use `useTranslation`. Either commit to English-only (delete `nl/` and `LanguageSwitcher`) or finish Dutch. Don't ship in between.

### S7. `delete-user-data` doesn't actually delete everything
*Security + Data + Production all flagged*

Misses: `purchases`, `access_codes`, `n8n_chat_histories`, `saved_jobs`, `user_job_searches`, possibly `chat_highlights`. GDPR Art. 17 wants all of it. The AI agent's memory still has the user's transcript post-deletion.

### S8. Chat input is `position: fixed` — on iOS the keyboard hides the send button
`ChatInput.tsx:88-94`. Test on a real iPhone. Likely needs `position: sticky` inside a flex column, or use `visualViewport` API + `dvh` units.

### S9. CSP allows `https://cdnjs.cloudflare.com` for scripts but the dependency that needed it (`pdfjs-dist` client-side parser) isn't imported anywhere
*Architecture + Security + Production flagged*

`clientSidePdfParser.ts` is dead. Drop the dep (~10MB), drop the CSP allowance. Reduces attack surface.

### S10. `useReports` errors are silently ignored on Dashboard
`Dashboard.tsx:37` destructures only `reports` and `isLoading`. If the report query fails, user lands in "no report yet" state and may re-pay. Surface a toast + retry.

### S11. Email reminders missing `List-Unsubscribe` headers
Gmail will start spam-foldering after a few complaints. Add `List-Unsubscribe` + `List-Unsubscribe-Post` on every Resend send. Also add a `text` plain-text alternative — HTML-only mail gets dinged.

### S12. Authentication required pages have no useful CTA when unauthenticated
`Assessment.tsx:58-66` shows "Authentication required. Please sign in." as text. Redirect to `/auth` like Dashboard does at `line 281-282`.

### S13. Chat session "x" close button is the lowercase letter `x`, not an icon
`Chat.tsx:480`. Replace with `<X className="h-4 w-4" />` from lucide.

### S14. `parse-resume` legacy function has no rate limit, no size cap, and verbose error responses
`parse-resume/index.ts`. If `parse-resume-ai` is the canonical path, delete this. Otherwise: add `checkRateLimit`, cap input at 5MB, strip the debug block from errors.

### S15. Migrations folder is missing the baseline schema
There is no `CREATE TABLE` for `access_codes`, `answers`, `reports`, `report_sections`, `profiles`, etc. Only incremental additions exist. Run `supabase db dump --schema-only` and commit it as `00000000000000_baseline.sql`.

### S16. Autosave can race the final submit
`useSurveyState.ts:153-179` — debounced 1.5s autosave can fire after submit changes status. **Fix:** guard the upsert with `.eq('status', 'draft')` so a draft write can never overwrite a submitted row.

### S17. `forward-to-n8n` fetch has no AbortController
`forward-to-n8n/index.ts:100-142`. If n8n hangs, the edge function hangs until Supabase's 50s wall clock kills it. Wrap fetch in a 20–25s AbortController.

### S18. No skip-to-content link, no `<main>` landmark
Accessibility baseline. Add a skip link in App.tsx + wrap each page in `<main>`.

---

## Post-Launch Sprint 1 (first 1–2 weeks)

- Flip TypeScript `"strict": true` in `tsconfig.app.json:18-22`. Currently fully disabled. Expect ~200 errors, mostly trivial null guards.
- Add Vitest + 15 tests covering payment flow, access-code verify, engagement upsert, useReports, useReportSections. Zero tests today.
- Sweep `as any` casts on tables that are actually typed (Profile.tsx, Chat.tsx, useEngagementTracking.ts, useLanguage.ts). ~10 lines, mechanical.
- Pick one toast system — both shadcn `useToast` and `sonner` are mounted in `App.tsx:73-74`. 24 files use shadcn, 1 uses sonner → drop sonner.
- Align edge-function `deno/std` and `supabase-js` versions (currently 3 different std versions and 3 different supabase-js versions across functions).
- Resume-upload consolidation: pick one path between `useResumeUpload` (legacy) and `useAIResumeUpload`. Delete the loser plus the `parse-resume-ai` orphan if applicable.
- Centralize error handling: `lib/errors.ts` + `lib/logger.ts`. Today: 67 try/catch + 63 toast() + 132 console.* with no shared pattern.
- Standardize edge functions on `_shared/cors.ts` — 5 stragglers don't use it (`auth-callback`, `send-reminder-email`, `submit-chapter-feedback`, `wrap-up-extract`, `wrap-up-save`).
- Split `ChatMessage.tsx (1100 lines)`, `ChatContainer.tsx (857)`, `Dashboard.tsx (570)`, `Index.tsx (1011)`.
- Delete dead code: `Hero.tsx`, `Pricing.tsx`, `WhyAtlas.tsx`, `HpTryout.tsx`, `clientSidePdfParser.ts`, `aiResumeParser.ts`, `resumeTextExtractor.ts`. Gate `/color-test` behind `import.meta.env.DEV`.
- Rename `package.json` from `vite_react_shadcn_ts` to `atlas-assessments` or `cairnly-web`. Rewrite the Lovable-boilerplate `README.md`.
- Pick one package manager: either delete `bun.lockb` or `package-lock.json`.
- Drop `openai` npm dep (zero imports) and `pdfjs-dist` (after dead code is removed).
- Set sensible react-query defaults in `App.tsx:53`: `staleTime: 30_000`, `refetchOnWindowFocus: false`.

---

## Pre-Launch Ops Checklist (ordered)

1. **Set `N8N_SHARED_SECRET`** in Supabase prod env. Verify: `curl -X POST .../chat-session-complete` without the header → 401 (after B3 fix lands).
2. **Set `STRIPE_WEBHOOK_SECRET`** + register the webhook in Stripe dashboard. Test with `stripe trigger checkout.session.completed`.
3. **Apply all 4 RLS migrations** from `docs/SUPABASE_RLS_FIXES.md`. Verify each with anon-key curl.
4. **Wire Sentry** on frontend (`@sentry/react`). Add `SENTRY_DSN` to Vercel envs.
5. **Enable Supabase PITR backups** (Pro plan). Run one restore drill in staging.
6. **Verify DNS:** cairnly.io and www.cairnly.io A/AAAA → Vercel; SPF + DKIM + DMARC on cairnly.io for Resend. Test via mail-tester.com (target ≥9/10).
7. **Confirm Stripe is in live mode**, `STRIPE_SECRET_KEY` = `sk_live_…`. Do one €1 real-money e2e purchase as final smoke.
8. **Seed one manual access code** for e2e walk without paying. Deactivate after.
9. **Walk the full path with fresh creds** (incognito): purchase → email → signup → assessment → submit → ReportProcessing → /chat → all 11 sections → wrap-up → /report → export-data → delete-account. Anything > 60s spinner gets copy review.
10. **Test failure modes:** deactivate n8n WF1, submit assessment, confirm `failed` surfaces correctly (after B5 fix). Reactivate.
11. **Test Stripe webhook replay:** Stripe retries; verify idempotency (after B9 fix).
12. **Set spend caps:** OpenAI monthly cap + 50/80/100% alerts. Gemini same. Stripe high-failure-rate alert. Supabase DB-size + function-invocations alerts. n8n.cloud execution-quota alert.
13. **Confirm Resend domain verification.** Inspect a test email for `dkim=pass dmarc=pass`.
14. **Set all Vercel + Supabase env vars.** Edge-function vars live in Supabase, not Vercel.
15. **Test GDPR delete** on a throwaway account; verify `n8n_chat_histories`, `purchases`, `access_codes` are erased (after S7 fix).
16. **Search built `dist/`** for any string containing the service-role JWT prefix before deploying. Must be zero hits.
17. **Run axe DevTools** on Dashboard, Chat, Survey Q1, Survey final, Report. Fix contrast + missing-label issues.
18. **Add monitoring:** alert on `reports.status='processing'` rows older than 10 minutes (= stuck pipeline).

---

## First-72-Hour Monitoring Plan

**Tabs to keep open:**
- Sentry — Issues feed (production env filter)
- Stripe — Payments + Webhooks (success rate > 99%)
- Supabase Functions → Logs (filter error)
- n8n.cloud Executions, filter "failed" per workflow ID
- Resend Activity (bounces, complaints — pause campaign at >0.3% complaint rate)
- Vercel Analytics + Deployments

**Hourly first 6 hours, then 4-hourly:**
```sql
SELECT status, count(*) FROM reports
WHERE created_at > now() - interval '6 hour' GROUP BY 1;
```
Anything stuck in `processing` >10 min = real failure.

Reconcile `purchases` count against Stripe payments. Drift = webhook problem.

OpenAI usage dashboard — should be linear with user count, not exponential (exponential = abuse via B10).

**Hard kill criteria — pull the launch banner if any of these:**
- Webhook signature failures > 0 sustained
- > 5% of reports stuck in `processing` after 10 min
- Resend bounce > 3% or complaint > 0.3%
- Unhandled Sentry error > 10/hour
- Supabase function 5xx rate > 2%

---

## Suggested Order of Attack

If you have one focused day before launch, do them in this order — high-impact-per-minute first:

1. **B11** (wrap-up model name typo — 2 min)
2. **B12** (Sentry — 30 min)
3. **B3 + B4** (shared-secret fail-closed + trigger headers — 1 hr)
4. **B8** (apply pending RLS migrations — 30 min)
5. **B5** (add 'failed' to status CHECK — 10 min migration)
6. **B6 + B7** (atomic usage_count + signup-time consumption — 1–2 hr)
7. **B1 + B2** (JWT auth on all the user-scoped edge functions — 2–3 hr, mechanical)
8. **B9** (Stripe webhook required + UNIQUE on stripe_session_id — 30 min)
9. **B10** (n8n header auth on the public webhooks — 30 min interim, full proxy later)
10. **S6** (decide i18n — delete nl/ if not finishing it — 15 min)
11. Pre-launch ops checklist items 1-9 in order.

Everything else can ship.
