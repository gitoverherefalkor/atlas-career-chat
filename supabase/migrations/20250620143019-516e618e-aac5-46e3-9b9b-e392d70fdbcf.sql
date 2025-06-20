
-- Create table for N8N workflow error logging
CREATE TABLE public.aa_dead_letter_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  failed_node TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to the table
ALTER TABLE public.aa_dead_letter_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert error logs
CREATE POLICY "Service role can insert error logs" 
  ON public.aa_dead_letter_log 
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Create policy to allow authenticated users to view error logs (if needed for debugging)
CREATE POLICY "Authenticated users can view error logs" 
  ON public.aa_dead_letter_log 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Add index for better query performance
CREATE INDEX idx_aa_dead_letter_log_timestamp ON public.aa_dead_letter_log(timestamp);
CREATE INDEX idx_aa_dead_letter_log_workflow_name ON public.aa_dead_letter_log(workflow_name);
