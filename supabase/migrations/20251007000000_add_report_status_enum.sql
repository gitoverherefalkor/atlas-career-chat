-- Add check constraint for report status values
-- Status flow: processing -> pending_review -> completed
-- processing: n8n is generating the initial report
-- pending_review: report generated, awaiting user chat/feedback
-- completed: user has provided feedback via chat, report is finalized

DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'reports_status_check'
    ) THEN
        ALTER TABLE reports DROP CONSTRAINT reports_status_check;
    END IF;

    -- Add new constraint with valid status values
    ALTER TABLE reports
    ADD CONSTRAINT reports_status_check
    CHECK (status IN ('processing', 'pending_review', 'completed'));
END $$;

-- Update default value for status column
ALTER TABLE reports
ALTER COLUMN status SET DEFAULT 'processing';

-- Add comment explaining the status flow
COMMENT ON COLUMN reports.status IS 'Report status: processing (n8n generating), pending_review (awaiting chat feedback), completed (finalized after chat)';

-- Create index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
