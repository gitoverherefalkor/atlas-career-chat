-- Add status column to distinguish autosaved drafts from final submissions.
-- 'draft'     = autosaved in-progress (does NOT trigger n8n)
-- 'submitted' = user clicked Submit (n8n already invoked from useSurveyCompletion)
--
-- Pre-flight done in this branch: confirmed no duplicate access_code_ids remain
-- (one byte-identical pre-isSubmittingRef-guard double-submit was deduped).

ALTER TABLE answers
  ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted'));

-- Backfill: rows without submitted_at are drafts; with submitted_at are submitted (default already covers).
UPDATE answers SET status = 'draft' WHERE submitted_at IS NULL;

-- One row per access_code_id (status flips from draft to submitted on final submit).
ALTER TABLE answers
  ADD CONSTRAINT answers_access_code_id_unique UNIQUE (access_code_id);

COMMENT ON COLUMN answers.status IS 'draft = autosaved in-progress, submitted = user clicked Submit (triggers n8n)';
