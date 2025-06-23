
-- Add resume_data column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN resume_data jsonb;
