
-- Add column to store AI-parsed structured resume data
ALTER TABLE public.profiles 
ADD COLUMN resume_parsed_data jsonb;
