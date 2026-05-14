-- Add 'failed' to the reports.status CHECK constraint.
-- Why: forward-to-n8n writes status='failed' on retry exhaustion (lines 78, 94, 148),
-- but the existing CHECK only allows processing/pending_review/completed. Every
-- failure write throws, leaving reports stuck in 'processing' and the user stuck
-- on /report-processing polling forever. ReportProcessing.tsx already handles
-- the 'failed' phase correctly — this just lets the write land.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reports_status_check'
    ) THEN
        ALTER TABLE reports DROP CONSTRAINT reports_status_check;
    END IF;

    ALTER TABLE reports
    ADD CONSTRAINT reports_status_check
    CHECK (status IN ('processing', 'pending_review', 'completed', 'failed'));
END $$;

COMMENT ON COLUMN reports.status IS 'Report status: processing (n8n generating), pending_review (awaiting chat feedback), completed (finalized after chat), failed (n8n pipeline failed after retries)';
