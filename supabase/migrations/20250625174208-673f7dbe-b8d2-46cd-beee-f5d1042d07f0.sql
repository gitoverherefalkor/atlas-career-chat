
-- Add resume_uploaded_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN resume_uploaded_at timestamp with time zone;
