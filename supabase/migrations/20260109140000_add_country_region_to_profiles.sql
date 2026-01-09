-- Add country and region columns to profiles table
-- country: from payment form
-- region: from survey question 11111111-1111-1111-1111-111111111114

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS region text;

-- Add comment for clarity
COMMENT ON COLUMN profiles.country IS 'Country from payment form (Stripe billing)';
COMMENT ON COLUMN profiles.region IS 'Region from survey Section 1 (e.g., Northern and Western Europe)';
