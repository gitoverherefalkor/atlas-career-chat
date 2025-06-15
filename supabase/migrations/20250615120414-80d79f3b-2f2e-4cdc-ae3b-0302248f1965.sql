
-- Check if RLS is enabled on reports table and enable if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'reports' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Check if RLS is enabled on report_sections table and enable if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'report_sections' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add missing policies for reports table (only if they don't exist)
DO $$
BEGIN
    -- Users can create their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can create their own reports'
    ) THEN
        CREATE POLICY "Users can create their own reports" 
          ON public.reports 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can update their own reports'
    ) THEN
        CREATE POLICY "Users can update their own reports" 
          ON public.reports 
          FOR UPDATE 
          USING (auth.uid() = user_id);
    END IF;

    -- Users can delete their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can delete their own reports'
    ) THEN
        CREATE POLICY "Users can delete their own reports" 
          ON public.reports 
          FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add policies for report_sections table (only if they don't exist)
DO $$
BEGIN
    -- Users can view sections of their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'report_sections' AND policyname = 'Users can view their own report sections'
    ) THEN
        CREATE POLICY "Users can view their own report sections" 
          ON public.report_sections 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE reports.id = report_sections.report_id 
              AND reports.user_id = auth.uid()
            )
          );
    END IF;

    -- Users can create sections for their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'report_sections' AND policyname = 'Users can create sections for their own reports'
    ) THEN
        CREATE POLICY "Users can create sections for their own reports" 
          ON public.report_sections 
          FOR INSERT 
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE reports.id = report_sections.report_id 
              AND reports.user_id = auth.uid()
            )
          );
    END IF;

    -- Users can update sections of their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'report_sections' AND policyname = 'Users can update their own report sections'
    ) THEN
        CREATE POLICY "Users can update their own report sections" 
          ON public.report_sections 
          FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE reports.id = report_sections.report_id 
              AND reports.user_id = auth.uid()
            )
          );
    END IF;

    -- Users can delete sections of their own reports
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'report_sections' AND policyname = 'Users can delete their own report sections'
    ) THEN
        CREATE POLICY "Users can delete their own report sections" 
          ON public.report_sections 
          FOR DELETE 
          USING (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE reports.id = report_sections.report_id 
              AND reports.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    -- Add foreign key for report_sections -> reports
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_report_sections_report_id'
    ) THEN
        ALTER TABLE public.report_sections 
        ADD CONSTRAINT fk_report_sections_report_id 
        FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for reports -> access_codes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reports_access_code_id'
    ) THEN
        ALTER TABLE public.reports 
        ADD CONSTRAINT fk_reports_access_code_id 
        FOREIGN KEY (access_code_id) REFERENCES public.access_codes(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key for reports -> surveys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reports_survey_id'
    ) THEN
        ALTER TABLE public.reports 
        ADD CONSTRAINT fk_reports_survey_id 
        FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON public.report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_access_code_id ON public.reports(access_code_id);
CREATE INDEX IF NOT EXISTS idx_reports_survey_id ON public.reports(survey_id);
