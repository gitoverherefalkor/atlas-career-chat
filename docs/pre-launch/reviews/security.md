# Atlas Assessments — Pre-Release Security Review

Scope: `supabase/migrations/`, `supabase/functions/`, `src/integrations/supabase/`, `vite.config.ts`, `vercel.json`, XSS sinks under `src/`. Read-only review.

## Strengths

- **CSP and security headers are solid.** `vercel.json:11` ships a tight `Content-Security-Policy` (no `unsafe-inline`/`unsafe-eval` for scripts, locked-down `connect-src` and `frame-src`), plus `Strict-Transport-Security` with preload, `X-Frame-Options: DENY`, and a sensible `Permissions-Policy`.
- **CORS origin allowlist.** `supabase/functions/_shared/cors.ts:5-27` restricts to `cairnly.io`, `www.cairnly.io`, and localhost — no wildcard.
- **DOMPurify is used everywhere user-influenced content hits the DOM.** `src/components/survey/QuestionRenderer.tsx:447`, `src/components/ReportSections.tsx:34`, `src/components/chat/ChatMessage.tsx:921`, `src/components/report/ExpandedSectionView.tsx:85`.
- **Stripe webhook signature verification is correct** when used. `supabase/functions/payment-success/index.ts:112-128` calls `stripe.webhooks.constructEvent` with the env-injected secret.
- **GDPR delete and export functions correctly derive identity from the JWT.** `supabase/functions/delete-user-data/index.ts:22-31` and `export-user-data/index.ts:20-31` create a user-scoped client to call `auth.getUser()` before any service-role action.
- **Rate limiting** on `verify-access-code` (10/min), `signup-with-access-code` (5/min), `create-checkout` (5/min), `parse-resume-ai` (5/min), `tts` (30/min) and `search-jobs` (10/min).
- **Cryptographically random access codes** via `crypto.getRandomValues` (`payment-success/index.ts:15-27`).
- **`auth-callback` puts session in URL fragment, not query string** (`supabase/functions/auth-callback/index.ts:111-115`) — keeps tokens out of referrer headers and server logs.
- **`.env` is gitignored** and only publishable (anon) keys are present in the bundle.
- **Survey-completion access code update writes `user_id`** (`useSurveyCompletion.ts:59`), creating a link that can be RLS-checked.

## Critical (block release)

### 1. `forward-to-n8n` accepts `user_id` from the client with no auth check
File: `supabase/functions/forward-to-n8n/index.ts:31-46`. The function uses the service role key (line 27) and trusts whatever `user_id` or `user_email` the request body says. No JWT verification.

**Attack:** Authenticated or unauthenticated attacker POSTs `{user_id: "<victim-uuid>", payload: {...}}` to the function. A new `reports` row is inserted under the victim's account, n8n generates a full assessment using the attacker's responses, and the victim sees garbage results on their dashboard plus a "your report is ready" email. Also a free way to burn the victim's resource quotas (n8n credits, OpenAI, etc.).

**Fix:** Extract the caller's JWT via the `Authorization` header, create a user-scoped client, call `auth.getUser()`, and use `user.id` exclusively — drop the `user_id` / `user_email` body fields.

### 2. `deliver-section` accepts `user_id` and `session_id` from the client with service-role writes
File: `supabase/functions/deliver-section/index.ts:99-117, 140-143, 206-235`. No JWT check. Service role inserts into `chat_messages` using the body-supplied `user_id`.

**Attack:** Attacker POSTs `{report_id, section_type, user_id: "<victim-uuid>", session_id: "<victim-session>", user_message: "<arbitrary content>"}`. The function writes an attacker-controlled message into the victim's `chat_messages` and `n8n_chat_histories`, poisoning the LLM's memory and the wrap-up extract. Because section content is fetched only by `report_id` (no ownership check), the attacker can also enumerate any user's report content if they can guess/scrape a report UUID.

**Fix:** Verify JWT, derive `user_id`, and confirm the `report_id` belongs to that user before fetching content or writing.

### 3. `payment-success` fallback path lets anyone redeem any paid Stripe session
File: `supabase/functions/payment-success/index.ts:129-139`. If the request lacks a `stripe-signature` header (so the webhook branch is skipped), the function accepts a `sessionId` from the body, fetches it from Stripe, and if it's `paid` issues a fresh access code and emails it to whatever `customer_details.email` Stripe returns.

**Attack:** An attacker who learns a victim's Stripe `cs_…` session ID (referrer headers, browser history, shared links, log leaks) can call this endpoint and trigger generation of a fresh access code that gets emailed to the original customer — or if `customer_email` was set client-side, potentially the access code response (`accessCode: accessCode`) is returned in the JSON to the attacker (line 240-247). At minimum it's an unbounded code-minting vector if the same session is replayed; even with idempotency at the `purchases` row, the attacker can force duplicate access codes if no unique constraint exists on `stripe_session_id`.

**Fix:** Remove the body-`sessionId` fallback entirely. Require the Stripe webhook signature path. If you must keep a polling endpoint for the success page, verify the caller's authenticated email matches `session.customer_details.email` before returning anything sensitive, and dedupe on `stripe_session_id` with a unique constraint.

### 4. `forward-resume-to-n8n` accepts `user_id` from client, no JWT check
File: `supabase/functions/forward-resume-to-n8n/index.ts:11-14, 29-33`. Passes whatever the client says to n8n. Combined with the n8n workflow writing parsed resume data to the profile by `user_id`, an attacker can replace any user's parsed resume with their own — which subsequently feeds the personality / career analysis.

**Fix:** Verify JWT, override `user_id` from the token, validate `file_url` is in the caller's own storage prefix (`{userId}/`).

### 5. `signup-with-access-code` never increments `usage_count`
File: `supabase/functions/signup-with-access-code/index.ts:97-117`. After the access-code validity check, the function creates the user but does not update the code's `usage_count` or link the code to the new user. The increment is done client-side in `useSurveyCompletion.ts:54-60` only after the survey is submitted.

**Attack:** Take one valid code, register N accounts. Each account passes the `usage_count >= max_usage` check until somebody submits a survey. Also: someone with the code can be racing/parallel-signing-up while the legitimate buyer hasn't finished the survey yet. Easy account-creation abuse on paid codes.

**Fix:** Inside the edge function, atomically increment `usage_count` (and set `user_id` / `used_at`) in the same transaction as user creation. Roll back the user if the increment fails. Make `usage_count` updateable only via service role (RLS).

### 6. Postgres trigger calls `analysis-completed` without the shared secret
File: `supabase/migrations/20250918090000-report-completed-trigger.sql:14-25` builds headers with only `Content-Type`. The function (`analysis-completed/index.ts:16-17`) requires `x-shared-secret`.

If `N8N_SHARED_SECRET` is set in production, the trigger silently fails (no email gets sent — but more importantly, `_shared/cors.ts:46-49` falls through and logs a warning if the secret is **unset**, meaning the function will accept anyone's POST in that case). Either:
- The secret is set and the success email pipeline is broken (functional bug), or
- The secret is unset and any attacker can POST `{report_id: "<victim-uuid>"}` to flip the victim's report to `pending_review` and trigger a real email blast from `no-reply@cairnly.io`.

**Fix:** Pass `x-shared-secret` as a header in the pg_net call (read from Vault, same as `check_and_send_reminders` does). Confirm `N8N_SHARED_SECRET` is set in production. Remove the "graceful degradation" branch in `verifySharedSecret` that bypasses auth when the secret is missing — fail closed.

## Important (fix before public launch)

### 7. `chat-session-complete` has the same fail-open behaviour
`supabase/functions/chat-session-complete/index.ts:16-17` relies on `verifySharedSecret` which silently passes when `N8N_SHARED_SECRET` is unset. Unauthenticated callers can flip arbitrary `reports.status` to `completed`. Same fix as #6 — fail closed.

### 8. `wrap-up-save` / `wrap-up-extract` / `submit-chapter-feedback` have no auth at all
Each uses the service role key and accepts `report_id` from the body with no JWT check (`wrap-up-save/index.ts:131-176`, `wrap-up-extract/index.ts:109-129`, `submit-chapter-feedback/index.ts:136-167`).

**Attack:** Any attacker with a report UUID can: read the full chat history (wrap-up-extract returns a model-generated digest including OpenAI calls billed to you), or **overwrite** the user's "Discussion Highlights" or chapter feedback with arbitrary content. `wrap-up-save` even flips status to `completed`. Attacker pays nothing, you pay OpenAI per request.

**Fix:** Verify JWT, then `SELECT user_id FROM reports WHERE id = report_id` and compare against `auth.uid()`.

### 9. `aa_dead_letter_log` SELECT policy is `USING (true)` for any authenticated user
`supabase/migrations/20250620143019-…sql:24-27`. Every authenticated user can read every workflow error log. Error messages frequently contain payload snippets, user IDs, emails.

**Fix:** Drop the SELECT policy for `authenticated`. Restrict to `service_role` only, or to a dedicated admin role.

### 10. `report_sections` SERVICE role UPDATE has `USING (true)` (acceptable) but no row-level service-write attribution
`supabase/migrations/20250621140512-…sql:33-46` is for service role only (fine), but combined with #2 and #8 above any caller with the anon key can effectively use these via deliver-section/wrap-up-save. The RLS is bypassed because all writes go through service-role-backed functions that don't authenticate. Patching #2 and #8 covers this.

### 11. CSP allows `script-src https://cdnjs.cloudflare.com`
`vercel.json:11`. Broadly opens an entire third-party CDN as a script source. Either pin to a `sha256-` hash for the specific script you actually need from cdnjs, or self-host the file. Otherwise any future cdnjs supply-chain incident is a direct XSS.

### 12. `payment-success` returns the freshly minted access code in the response body
Lines 238-247. Anyone with a paid Stripe session ID can retrieve a usable access code (see #3). Even after #3 is fixed, consider not returning the code at all — the email delivery is the canonical channel. If the success page needs to display it, scope the access via a one-time signed link or short-lived token tied to the authenticated session.

### 13. Trigger `_notify_report_completed` does not use `pg_net` headers correctly
`supabase/migrations/20250918090000-…sql:13-23` — `extensions.net.http_post(url, headers, payload::text)`. Per pg_net, that signature passes `headers` as the second positional arg; the trigger doesn't include any auth at all, and the Content-Type-only headers don't help (see #6). Switch to named args (`url := …, body := …, headers := …`) and include the shared secret from Vault. Bonus: the call ignores the response, so failures are silent.

### 14. CORS handler always returns an `Access-Control-Allow-Origin` even when origin doesn't match
`_shared/cors.ts:21-23` returns `ALLOWED_ORIGINS[0]` ("https://cairnly.io") whenever the origin isn't in the allowlist. That's harmless for browser CORS (the actual browser blocks it because the requested origin won't match), but it sends the wrong signal to monitoring and can mask misconfigurations. Either omit the header for non-allowed origins, or return `'null'`.

### 15. `analysis-completed` and `chat-session-complete` use different env var names for service role
`analysis-completed` uses `NEW_N8N_SERVICE_ROLE_KEY` (`index.ts:29`), `chat-session-complete` uses `SUPABASE_SERVICE_ROLE_KEY` (`index.ts:33`), and so on across the function set. This makes it easy to forget to rotate one and have a function continue working with a stale key. Standardize on one variable name.

## Minor / hardening

### 16. Auth flow leaks unauthenticated user_id discovery
`forward-to-n8n/index.ts:34-41` looks up a user by `user_email` if `user_id` isn't provided. Combined with #1, this lets an attacker enumerate which emails are registered (`200 OK` vs. `400 user_id required` distinguishes a known email from an unknown one). Fix by removing the email→id fallback once JWT auth is in place.

### 17. `verify-access-code` logs only "Access code verification requested" (good), but error path returns `needsPurchase: true/false` (`index.ts:51, 73, 85`)
This gives a brute-force oracle: "not found" → keep guessing; "deactivated" → known valid code, contact support. Acceptable, but consider returning a uniform error message and using server-side observability for the distinction.

### 18. In-memory rate limiter is per edge-function instance (`_shared/cors.ts:78-87`)
Documented in comments. For brute-force on access codes specifically (32-char alphanumeric is plenty of entropy, so brute-force is unrealistic), this is fine. Worth knowing it's not a true cluster-wide limiter.

### 19. `reports.payload` JSON column holds full survey responses
After `forward-to-n8n` writes them. This is fine for storage, but note that this column is also returned by `export-user-data` (good) and is service-role only via reports RLS — confirm production RLS on `reports` does not have any wide SELECT policy beyond `auth.uid() = user_id`.

### 20. Profile-creation backfill in `20251230120000_create_profile_trigger.sql` runs in the migration
The backfill does `INSERT … ON CONFLICT (id) DO NOTHING`. Fine for idempotency, but make sure this migration cannot be re-run against a production DB that already has the trigger active — otherwise you'll double-fire `handle_new_user`. Add a guard or move the backfill to a separate, one-shot script.

### 21. `delete-user-data` does not delete from every table the user touches
Misses: `purchases` (rows still reference the access code), `access_codes` (the `user_id` column still points at the deleted account), `answers`, `n8n_chat_histories`, `saved_jobs`, `user_job_searches`. GDPR Art. 17 wants all of it. Walk the schema once and extend the delete order.

### 22. `vercel.json` rewrite rule `/((?!assets/).*)` rewrites the worldwide path to `/`
SPA fallback is fine, but you may want to add `api/` and `functions/` to the negative lookahead if you ever proxy any backend endpoints through Vercel.

### 23. `error_logs`, `api_error_logs`, `prompts`, `ai_research`, `enriched_jobs`, `enriched_careers`, `sop_vectors`, `match_documents`
These exist in `src/integrations/supabase/types.ts` but no migration in the repo creates them or sets RLS. **I cannot determine RLS status from the code.** Verify each in production: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...)`. If any have RLS off, that's an immediate fix.

### 24. `tts` exposes a 30/min/IP rate limit on OpenAI
Cost-controlled by IP only. A single hostile user behind a botnet can rack up your OpenAI bill. Consider an authenticated-user-scoped rate limit on top (Supabase `auth.uid()`), or cap monthly spend in the OpenAI dashboard.

## Pre-launch checklist

1. **Verify `N8N_SHARED_SECRET` is set** in production for the edge functions AND in the `pg_net` headers from triggers (`_notify_report_completed`). Remove the "fail-open if unset" branch in `_shared/cors.ts:46-49`.
2. **JWT-verify every edge function that writes user-scoped data:** `forward-to-n8n`, `forward-resume-to-n8n`, `deliver-section`, `wrap-up-save`, `wrap-up-extract`, `submit-chapter-feedback`. Pattern: copy `delete-user-data/index.ts:14-31`.
3. **Patch `payment-success`:** require the Stripe webhook signature branch, remove the body-`sessionId` fallback, add a unique constraint on `purchases.stripe_session_id`.
4. **Atomic access-code consumption in `signup-with-access-code`:** increment `usage_count` inside the function, not on the client.
5. **Audit every table in production** for RLS enabled and ownership-scoped SELECT/INSERT/UPDATE/DELETE. List from `src/integrations/supabase/types.ts`.
6. **Confirm service-role keys are only set on edge functions, not in the Vite build.** Search built `dist/` for any string containing the service role JWT before deploying.
7. **Confirm Vault holds `supabase_service_role_key`** (used by `check_and_send_reminders` cron) and rotate after launch.
8. **Tighten CSP `script-src`:** drop `https://cdnjs.cloudflare.com` or pin specific hashes.
9. **Extend `delete-user-data`** to cover `purchases`, `access_codes`, `answers`, `n8n_chat_histories`, `saved_jobs`, `user_job_searches`.
10. **Set OpenAI / Gemini / Resend spend caps** at the provider dashboards as a backstop against amplification abuse via #2, #8, #24.
11. **Standardize service-role env var name** across all edge functions (currently mixed `SUPABASE_SERVICE_ROLE_KEY` vs. `NEW_N8N_SERVICE_ROLE_KEY`).
