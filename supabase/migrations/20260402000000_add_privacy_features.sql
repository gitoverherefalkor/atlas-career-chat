-- Privacy & GDPR improvements (April 2026)

-- 1. Consent tracking columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_consent_at TIMESTAMPTZ;

-- 2. Ensure RLS is enabled on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages (only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view own chat messages'
  ) THEN
    CREATE POLICY "Users can view own chat messages"
      ON public.chat_messages FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can insert own chat messages'
  ) THEN
    CREATE POLICY "Users can insert own chat messages"
      ON public.chat_messages FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Service role needs delete access for account deletion
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Service role can delete chat messages'
  ) THEN
    CREATE POLICY "Service role can delete chat messages"
      ON public.chat_messages FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Allow users to delete their own profile (for account deletion)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON public.profiles FOR DELETE
      USING (auth.uid() = id);
  END IF;
END $$;

-- 4. Allow deletion of own reports and related data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can delete own reports'
  ) THEN
    CREATE POLICY "Users can delete own reports"
      ON public.reports FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_engagement_tracking' AND policyname = 'Users can delete own engagement tracking'
  ) THEN
    CREATE POLICY "Users can delete own engagement tracking"
      ON public.user_engagement_tracking FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
