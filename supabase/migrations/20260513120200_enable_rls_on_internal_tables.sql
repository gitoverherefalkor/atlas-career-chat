-- Enable RLS on tables that were created out-of-band (not via migration) and
-- are currently wide open to anyone holding the anon key.
--
-- Per docs/SUPABASE_RLS_FIXES.md, these tables are:
--   prompts          — system prompts (the moat)
--   sop_vectors      — internal embeddings
--   enriched_jobs    — internal job-research output
--   error_logs       — pipeline error stream, may contain PII
--   api_error_logs   — same
--
-- None of these are read from the frontend or from edge functions via the
-- anon key (verified by grep). All edge functions accessing them use the
-- service role, which bypasses RLS. Enabling RLS without any policies makes
-- them service-role-only, which is the desired state.

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'prompts',
        'sop_vectors',
        'enriched_jobs',
        'error_logs',
        'api_error_logs'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
            RAISE NOTICE 'RLS enabled on public.%', t;
        ELSE
            RAISE NOTICE 'Table public.% does not exist — skipping', t;
        END IF;
    END LOOP;
END $$;

-- Note: FORCE ROW LEVEL SECURITY makes RLS apply even to the table owner.
-- Service role still bypasses RLS because it uses the bypassrls grant, not
-- table ownership.
