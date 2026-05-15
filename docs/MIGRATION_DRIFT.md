# Database Migration Drift — check this first

**Last updated: 2026-05-15**

## When to read this file

If you (or Claude) hit a bug that smells like "the database is missing a change"
— a feature that should work but errors out, a security check that isn't
firing, duplicate rows — **check the list below first.** One of these
unreconciled migrations may be the cause.

## What's going on (plain language)

A "migration" is a small file that changes the database's structure. The
project keeps a checklist of which migrations have been run on the live
database.

Right now that checklist is **out of sync** with reality, in both directions:

1. **6 migration files** exist in `supabase/migrations/` that the checklist says
   were never run on the live database.
2. **7 migrations** are recorded as run on the live database but have **no file**
   in the repo (applied straight in the Supabase dashboard at some point).

Because of this, you **cannot safely run `supabase db push`** — it would try to
apply all 6 "pending" files at once, and some may already be applied (causing
errors) while others may be genuinely missing.

The live app mostly works, so most of these were probably applied by hand in
the Supabase dashboard and just never ticked off the checklist. But "probably"
is the problem — until each one is verified, we don't know for sure.

## The 6 unreconciled migration files — symptoms to watch for

| Migration file | What it does | Symptom if it was NEVER applied |
|---|---|---|
| `20260513120000_add_failed_to_reports_status.sql` | Lets a report's status be set to `failed` | A failed report gets stuck showing `processing` forever; the user is stuck on the `/report-processing` page polling endlessly |
| `20260513120100_notify_report_completed_with_secret.sql` | Updates the "report completed" trigger to authenticate with the n8n shared secret | "Your report is ready" emails silently stop being sent. (Also needs a one-off Vault secret — see the file's header comment.) |
| `20260513120200_enable_rls_on_internal_tables.sql` | Turns on row-level security for internal tables (`prompts`, `sop_vectors`, `enriched_jobs`, `error_logs`, `api_error_logs`) | **Security gap:** those internal tables (system prompts, error logs that may contain personal data) are readable by anyone holding the public key |
| `20260513120300_consume_access_code_rpc.sql` | Adds the `consume_access_code` database function (safe, single-step access-code use) | Access-code redemption errors, or "function `consume_access_code` does not exist", or codes being used up too fast (double-counted) |
| `20260514120000_unique_stripe_session_id.sql` | Adds a uniqueness rule on `purchases.stripe_session_id` | One payment creates duplicate purchase rows and duplicate access codes (Stripe calls `payment-success` more than once: success page + webhook + retries) |
| `20260515145300_create_support_requests.sql` | Creates the `support_requests` table for the Support & Feedback form | **Already applied** by hand via the SQL editor on 2026-05-15. The table exists; only the checklist entry is missing. Harmless — the file is safe to re-run (`CREATE TABLE IF NOT EXISTS`). |

## How to reconcile (recommended)

Do this as its own focused task, not bolted onto feature work. For each of the
first 5 files above:

1. Check whether that change already exists in the live database (look at the
   table/constraint/function it creates, via the Supabase dashboard).
2. **If it already exists:** mark the migration as applied so the checklist
   matches reality — `supabase migration repair --status applied <version>`.
3. **If it does NOT exist:** apply it (paste the SQL in the dashboard SQL
   editor, then run the same `migration repair` so it's tracked).

The `20260515145300` support-requests migration just needs the
`migration repair --status applied 20260515145300` step (the table is already
there).

Once all 6 are reconciled, `supabase db push` becomes safe to use again.

The 7 remote-only migrations (records with no file) are lower priority — they
just mean the repo is missing a copy of some already-applied changes. Worth
pulling down eventually so the repo is a complete record, but they don't cause
bugs.
