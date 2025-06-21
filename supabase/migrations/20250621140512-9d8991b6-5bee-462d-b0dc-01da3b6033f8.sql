
-- Enhance the report_sections table to support structured content from N8N
ALTER TABLE public.report_sections 
ADD COLUMN chapter_id TEXT,
ADD COLUMN section_id TEXT,
ADD COLUMN subsection_id TEXT,
ADD COLUMN order_number INTEGER,
ADD COLUMN title TEXT;

-- Update existing records to have proper structure (for backward compatibility)
UPDATE public.report_sections 
SET chapter_id = CASE 
  WHEN section_type LIKE '%executive%' OR section_type LIKE '%summary%' THEN 'about-you'
  WHEN section_type LIKE '%personality%' OR section_type LIKE '%team%' THEN 'about-you'
  WHEN section_type LIKE '%strength%' THEN 'about-you'
  WHEN section_type LIKE '%growth%' THEN 'about-you'
  WHEN section_type LIKE '%value%' THEN 'about-you'
  ELSE 'career-suggestions'
END,
section_id = CASE
  WHEN section_type LIKE '%executive%' OR section_type LIKE '%summary%' THEN 'executive-summary'
  WHEN section_type LIKE '%personality%' OR section_type LIKE '%team%' THEN 'personality-team'
  WHEN section_type LIKE '%strength%' THEN 'strengths'
  WHEN section_type LIKE '%growth%' THEN 'growth'
  WHEN section_type LIKE '%value%' THEN 'values'
  ELSE section_type
END;

-- Create index for better query performance on the new columns
CREATE INDEX idx_report_sections_chapter_section ON public.report_sections(report_id, chapter_id, section_id);
CREATE INDEX idx_report_sections_order ON public.report_sections(report_id, order_number);

-- Create policy to allow service role to insert report sections (for N8N)
CREATE POLICY "Service role can insert report sections" 
  ON public.report_sections 
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Create policy to allow service role to update report sections (for N8N)
CREATE POLICY "Service role can update report sections" 
  ON public.report_sections 
  FOR UPDATE 
  TO service_role
  USING (true);
