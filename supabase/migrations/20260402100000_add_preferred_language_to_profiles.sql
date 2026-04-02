-- Add preferred_language to profiles for multilingual support
-- Defaults to 'en' so all existing users continue in English
ALTER TABLE profiles ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en';
