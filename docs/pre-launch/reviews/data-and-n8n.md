# Atlas Assessments — Backend / Data Layer Review

## Strengths

- **Survey persistence is well-thought-out.** `answers` has a UNIQUE constraint on `access_code_id` and a `status` CHECK constraint distinguishing `draft`/`submitted`; autosave upserts the draft row, final submit flips status in place. No more duplicate-submission rows. (`supabase/migrations/20260506120000_add_answers_status_for_autosave.sql:8-19`)
- **Final-submit guard via `isSubmittingRef`** prevents the double-click race in `useSurveySubmission.ts:30,70-71`.
- **`reports.status` has a CHECK constraint and an index** (`20251007000000_add_report_status_enum.sql`), and a `pg_net` trigger fires `analysis-completed` only on the actual transition, not every UPDATE.
- **CORS is locked down** to an allowlist + localhost regex (`supabase/functions/_shared/cors.ts:5-27`).
- **In-memory rate limiter** on signup, access-code verify, AI resume, checkout. (`_shared/cors.ts:96-140`)
- **Stripe webhook verifies signature** when configured (`payment-success/index.ts:107-128`).
- **Access-code email/code emails go via Resend with no-reply sender**, cryptographic code generation via `crypto.getRandomValues`. (`payment-success/index.ts:15-27`)
- **`forward-resume-to-n8n` uses an AbortController** with a 60 s timeout (`forward-resume-to-n8n/index.ts:24-43`).

## Critical (data loss / corruption risk, block release)

### 1. `forward-to-n8n` writes `status: 'failed'` that violates the CHECK constraint
`forward-to-n8n/index.ts:78, 94, 148` write `'failed'`, but the constraint added in `20251007000000_add_report_status_enum.sql:18-20` only allows `'processing' | 'pending_review' | 'completed'`. Every failure path will silently leave the report stuck in `'processing'` AND the update will throw. The end user sees no failure: they sit on `/report-processing` polling forever (`ReportProcessing.tsx:41-58` only redirects on `completed`, `pending_review`, or `failed`).

**Fix:** add `'failed'` to the CHECK constraint, or change the writes to a different state.

### 2. `usage_count` is double-incremented on every successful submission
- `useSurveySubmission.markAccessCodeAsUsed()` does a non-atomic read-then-increment (`useSurveySubmission.ts:32-65`).
- After it succeeds, `onComplete` calls `useSurveyCompletion.handleSurveyComplete()` which increments `usage_count` AGAIN from the stale in-memory `accessCodeData.usage_count` value (`useSurveyCompletion.ts:53-62`).

End result: every survey submission bumps `usage_count` by 2. Because `verify-access-code` rejects when `usage_count >= max_usage`, any code with `max_usage = 1` becomes unverifiable after first use even though `max_usage = 2` is the silent assumption. Combined with the read-then-write race, two concurrent tabs could over-increment further.

**Fix:** delete one of the two writers; switch to atomic `update ... set usage_count = usage_count + 1` (or a Postgres RPC) and have `verify-access-code` only allow `is_used = false` rather than counting.

### 3. `analysis-completed` and `chat-session-complete` have no idempotency
Both are server-to-server callbacks from n8n. If n8n retries (very common on transient network errors), `analysis-completed` will re-send the "report ready" email — the user gets two emails and the report goes pending_review again even if already completed. `chat-session-complete` blindly flips status to `completed`, ignoring whatever state the report is in.
- `analysis-completed/index.ts:33-44` — UPDATE has no `.eq('status', 'processing')` guard.
- `chat-session-complete/index.ts:37-45` — same.
- Compare to `wrap-up-save/index.ts:168-172` which DOES scope the update to `pending_review`.

**Fix:** guard with `.eq('status', <expected prior state>)` and short-circuit if no row was updated, OR add a dedupe key (n8n run id) and an `idempotency_keys` table.

### 4. The `reports` table allows unlimited rows per user
There is no UNIQUE on `(user_id)` or `(access_code_id)` for `reports`. Every survey submission (including resubmit) calls `forward-to-n8n`, which `.insert()`s a new row (`forward-to-n8n/index.ts:48-53`). The dashboard / processing-page polls "latest by created_at" — if a user submits twice, two parallel n8n runs race, both call `analysis-completed`, two reports end up populated, and which one users see depends on timing. Also, `ReportProcessing.tsx:37-48` filters by `user_id` not `access_code_id` and grabs the latest — so a returning user with an old `completed` report will be redirected to chat instead of waiting for the new run.

**Fix:** add UNIQUE on `(access_code_id)` for `reports`, or make `forward-to-n8n` an upsert.

### 5. `verify-access-code` returns the entire `access_codes` row to the caller
`verify-access-code/index.ts:42-44` does `select('*')` and never filters before responding. The function only forwards id/code/survey_type/remaining_uses (`:90-95`) but the bigger risk is that `is_active = false` users get the same response shape regardless of `user_id` binding. There is no `user_id` check, so any logged-in user who guesses someone else's code can use it. Mitigated by rate limiting (10/min) and code entropy, but worth tightening.

**Fix:** bind code to `user_id` on first use (`update access_codes set user_id = $userId where id = $code_id and user_id is null`).

### 6. `parse-resume` (PDF extraction) is unsafe and brittle
- No file size limit on the edge function (`parse-resume/index.ts`). Frontend enforces 10 MB (`ResumeUploadCard.tsx:74-75`), but the function itself trusts whatever lands in `formData`. A malicious uploader hitting the function directly can DOS the worker.
- Method 3 fallback (`parse-resume/index.ts:33-79`) decodes binary PDF as UTF-8 and regex-greps for `(...)` — this is unreliable and can OOM on large/encrypted PDFs.
- `pdf-parse` from esm.sh/skypack is dynamically imported on each cold start (no caching), adding latency and a third-party-CDN dependency that can fail. No timeout wrapped around the import.
- The extracted text is returned to the frontend, then re-sent to `parse-resume-ai` — the function does NOT call the AI itself or write to DB, so the message "OpenAI integration temporarily disabled for debugging" (`:226`) is shipping to prod.

**Fix:** add a `MAX_BYTES` check, kill Method 3, wrap pdf-parse in a 20 s timeout, vendor the import.

## Important (will hurt in production)

### 7. n8n contract is undocumented and brittle
The frontend sends a payload nested as `{ user_id, user_email, payload: { responses, accessCode, completedAt, surveyType, access_code_id, survey_id } }` (`useSurveyCompletion.ts:32-45`). `forward-to-n8n` rebuilds it as `{ user_id, report_id, survey_responses: surveyData, created_at, processing_status }` (`forward-to-n8n/index.ts:61-67`). n8n calls back with payloads of shape `{ report_id }`, sometimes `{ report_id: { answer: "uuid" } }` (`chat-session-complete/index.ts:23-25`). There is no schema for any of these — every shape change risks dropping fields silently.

**Fix:** define a TypeScript schema (or JSON-schema) in `_shared/` and validate both directions. Document the n8n callback contract.

### 8. `forward-to-n8n` retry on 5xx is unbounded by total time
Retry waits 30 s and tries once more (`forward-to-n8n/index.ts:100-142`). No `AbortController` on the fetch itself — n8n hanging forever will hang this edge function until Supabase's 50 s wall-clock kills it, then the report is stuck in `processing` (point 1) and the user sits forever on `/report-processing`. Same for the chat webhook in `useN8nWebhook.ts:20` (TIMEOUT_MS=120_000, but that's a frontend timeout, not what the n8n side respects).

**Fix:** wrap fetch in AbortController with 20-25 s timeout to leave room for retry within the edge function budget.

### 9. Autosave can clobber a successful submit
`useSurveyState.ts:153-179` has a debounced 1.5 s autosave that writes `status: 'draft', submitted_at: null`. The guard `if (submissionStatus === 'submitted' || submissionStatus === 'submitting') return;` (`:155`) is checked at the time the timer fires. Scenario: user clicks Submit, state flips to `submitting`, but a timer scheduled 1.4 s earlier has its callback queued and the closure captures the older `submissionStatus`. Result: the row is downgraded to `draft` AFTER the submit upsert. Risk is small (React closures usually update because `submissionStatus` is in the effect deps and the effect re-mounts), but the `clearTimeout` in the cleanup only fires when responses change — if responses haven't changed in 1.4 s, the timer survives. **Verify:** open two tabs, type in one, submit in the other, observe whether the `draft` status overwrites.

**Fix:** guard the upsert with a `.eq('status', 'draft')` so a draft write can never overwrite a `submitted` row.

### 10. `deliver-section` writes to `n8n_chat_histories` AND `chat_messages` non-transactionally
`deliver-section/index.ts:193-235` does two separate inserts. If the first succeeds and the second fails, the agent memory has a message the UI doesn't show (or vice versa). No rollback.

**Fix:** wrap in a Postgres function / RPC, or compensate on second-write failure.

### 11. `payment-success` is dual-mode (webhook OR frontend call) and the fallback path is exploitable
`payment-success/index.ts:107-139` — if `STRIPE_WEBHOOK_SECRET` is unset OR the request has no `stripe-signature` header, it falls back to "frontend calls with sessionId". Anyone who calls the endpoint with a valid (but already-claimed) session id can have a new access code generated AND emailed to whoever Stripe recorded — and a duplicate `purchases` row inserted. No check against existing `purchases.stripe_session_id`.

**Fix:** require webhook signature in prod; before inserting, check `select id from purchases where stripe_session_id = $1` and short-circuit if exists.

### 12. `forward-resume-to-n8n` has no rate limit
While `parse-resume-ai` is throttled at 5/min, the n8n forwarder (which presumably invokes a paid LLM) is not (`forward-resume-to-n8n/index.ts:4-9`). Also the signed URL is 5 minutes — fine for happy path, but if n8n is slow you'll get download failures buried in the n8n flow with no signal back to the user. **Fix:** add rate limit; consider 15-min signed URL; ensure n8n surfaces "download failed" back.

### 13. `delete-user-data` ignores other tables
Order looks right, but `access_codes` and `purchases` are NOT deleted (`delete-user-data/index.ts:42-103`). Those tables likely contain PII (email in `purchases`, code in `access_codes`). GDPR Art. 17 requires erasure of all personal data. Also `n8n_chat_histories` (LangChain-managed) is not cleared, meaning the AI memory still has the user's transcript.

**Fix:** delete `purchases` by email, null out `access_codes.user_id`, delete `n8n_chat_histories` rows with this user's `session_id` (= `report_id`).

### 14. `chat-session-complete` accepts a wrapped shape from n8n without validation
`chat-session-complete/index.ts:22-25` accepts `report_id` as either a UUID string or `{ answer: "uuid" }`. No further type check before the SQL update — if n8n sends `{ answer: 'or; DROP TABLE...' }`, the parameterised query handles it, but the lack of `uuid` validation means callers can probe table state.

**Fix:** validate UUID format before the query.

### 15. `OPENAI_API_KEY` model is `gpt-5.4-mini`
`wrap-up-extract/index.ts:189` — that model name does not exist. Either this is a placeholder that will 404 on every prod call, or someone hand-edited and broke it. The function will return 502 → user sees "Failed to generate highlights" at the end of chat.

**Fix:** verify the actual model name (`gpt-4o-mini`?).

### 16. Migrations folder is incomplete
There is no `CREATE TABLE` for `access_codes`, `answers`, `reports`, `report_sections`, `profiles`, `questions`, `surveys`, `chat_messages`, `purchases`, `n8n_chat_histories`. The migrations folder only contains incremental additions. The base schema lives only in the live DB. **Risk:** new dev sets up local Supabase, runs migrations, nothing works. **Risk:** restoring from migrations in a DR scenario is impossible.

**Fix:** snapshot the current schema with `supabase db dump` and add it as `00000000000000_baseline.sql`.

### 17. `handle_new_user` trigger crashes signup if RLS or insert fails
`20251230120000_create_profile_trigger.sql:2-26` is SECURITY DEFINER but if the `profiles` table grows a new NOT NULL column without a default (or the insert hits some constraint), every auth signup breaks. Same for `handle_new_user_tracking` (`20260324000000_add_engagement_tracking.sql:64-77`).

**Fix:** ensure these triggers either tolerate errors (`BEGIN ... EXCEPTION WHEN OTHERS THEN ... END`) or have a CI check.

### 18. Cron-based reminder system uses pg_net with hard-coded URL
`20260324000000_add_engagement_tracking.sql:93` hardcodes `https://pcoyafgsirrznhmdaiji.supabase.co/functions/v1/send-reminder-email`. If the project is forked/migrated, this fires at the old URL. Same in `20250918090000-report-completed-trigger.sql:11`.

**Fix:** read URL from Vault or a config table.

## Minor

- `markAccessCodeAsUsed` read-modify-write race (`useSurveySubmission.ts:36-58`). Two tabs submitting simultaneously could read same usage_count.
- `deliver-section` swallows feedback-write errors (`:255-257`). User never knows if their feedback was lost.
- `parse-resume` returns the entire extracted text in the HTTP response AND stores it in `profiles.resume_data` — `useAIResumeUpload.ts:131-134` then nulls it out a few seconds later. Race: if the second update fails or the page reloads in between, raw resume text persists.
- `forward-to-n8n` runs `select('id').eq('email')` to resolve user (`:34-41`). With many profiles sharing email (shouldn't happen, but if `profiles.email` isn't UNIQUE — not in repo migrations, so unknown), this could pick the wrong user.
- `aa_dead_letter_log` policy: "Authenticated users can view error logs" exposes internal error messages and workflow names to any logged-in user.
- `n8n_chat_histories` table has no migration in repo. RLS state unknown.
- `report_sections` indexes don't include `(report_id, section_type)` which is the primary access pattern in `deliver-section`, `submit-chapter-feedback`, and `wrap-up-save`. Only `(report_id, chapter_id, section_id)` and `(report_id, order_number)` exist.
- Migration `20250625175240` is a hard-coded data delete for a specific email — should not be a migration, it's a manual op.
- `payment-success` writes `survey_type: 'Office / Business Pro - 2025 v1 EN'` (`:170`) as a hardcoded string. New survey types will silently break.
- `wrap-up-extract` uses `messages.slice(transcript.length - MAX_CHARS)` which trims by character index on the joined string, but iterates over `messages` array.
- `parse-resume-ai` doesn't validate `prompt` field size — a malicious caller can send a 10MB prompt and burn Gemini quota.

## Pre-launch checklist

- [ ] Add `'failed'` to `reports_status_check` constraint (or remove `'failed'` writes from `forward-to-n8n`).
- [ ] Add UNIQUE constraint on `reports(access_code_id)` OR make `forward-to-n8n` upsert; add UNIQUE on `purchases(stripe_session_id)`.
- [ ] Remove one of the two `usage_count` increments; switch the survivor to atomic SQL.
- [ ] Add idempotency guard to `analysis-completed` (`.eq('status','processing')`) and `chat-session-complete` (`.eq('status','pending_review')`).
- [ ] Verify Stripe `STRIPE_WEBHOOK_SECRET` is set in prod and remove the fallback path (or hard-require sigverify).
- [ ] Fix the model name in `wrap-up-extract` (`gpt-5.4-mini` doesn't exist).
- [ ] Add file-size check in `parse-resume`; add timeout around `pdf-parse` import; consider deleting Method 3 fallback.
- [ ] Snapshot current DB schema as a baseline migration; commit it.
- [ ] Test: kill n8n, submit survey, observe — does the user see a real failure or get stuck at `/report-processing`?
- [ ] Test: open two tabs, submit one, watch autosave on the other for 5 minutes — does the row stay `submitted`?
- [ ] Test: n8n retries `analysis-completed` (force-resend webhook) — does the user get one email or two?
- [ ] Test: n8n retries `chat-session-complete` after wrap-up-save — does report state stay `completed` cleanly?
- [ ] Test: delete account via `delete-user-data` then check `purchases`, `access_codes`, `n8n_chat_histories` — fully erased?
- [ ] Test: upload a 9.5MB legit PDF, an encrypted PDF, a corrupt PDF, a non-PDF renamed `.pdf` — observe each.
- [ ] Add monitoring on `reports` rows in `processing` older than 10 min (alert = stuck pipeline).
- [ ] Add monitoring on `aa_dead_letter_log` inserts.
- [ ] Verify `profiles.email` has a UNIQUE constraint (look in prod DB; not in migrations).
- [ ] Run `EXPLAIN ANALYZE` on the dashboard query for a user with many reports, to confirm indexes hit.
