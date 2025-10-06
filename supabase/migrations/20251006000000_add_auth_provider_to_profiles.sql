-- Add auth_provider column to profiles table to track signup method
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Add comment
COMMENT ON COLUMN profiles.auth_provider IS 'Authentication provider used for signup: email, google, linkedin_oidc';
