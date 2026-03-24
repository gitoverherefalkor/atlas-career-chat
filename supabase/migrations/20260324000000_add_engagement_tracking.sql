-- =============================================================================
-- Engagement tracking for 24-hour reminder emails
-- Tracks user lifecycle: signup → survey → chat → complete
-- =============================================================================

-- 1. Engagement tracking table
CREATE TABLE IF NOT EXISTS public.user_engagement_tracking (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Survey lifecycle
  survey_started_at TIMESTAMPTZ,
  survey_last_activity_at TIMESTAMPTZ,
  survey_completed_at TIMESTAMPTZ,
  survey_last_section INT,
  survey_total_sections INT,

  -- Chat lifecycle
  chat_started_at TIMESTAMPTZ,
  chat_last_activity_at TIMESTAMPTZ,
  chat_completed_at TIMESTAMPTZ,
  chat_last_section_index INT,

  -- Reminder flags (timestamps prevent duplicate sends)
  signup_reminder_sent_at TIMESTAMPTZ,
  survey_reminder_sent_at TIMESTAMPTZ,
  chat_reminder_sent_at TIMESTAMPTZ,

  -- Bookkeeping
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_engagement_tracking ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own row
CREATE POLICY "Users can view own tracking"
  ON public.user_engagement_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tracking"
  ON public.user_engagement_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracking"
  ON public.user_engagement_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role needs full access for cron job
CREATE POLICY "Service role full access"
  ON public.user_engagement_tracking FOR ALL
  USING (auth.role() = 'service_role');

-- 2. Add email_reminders_enabled to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reminders_enabled BOOLEAN DEFAULT TRUE;

-- 3. Auto-create tracking row on user signup
--    (extends the existing handle_new_user pattern)
CREATE OR REPLACE FUNCTION public.handle_new_user_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_engagement_tracking (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_tracking ON auth.users;
CREATE TRIGGER on_auth_user_created_tracking
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tracking();

-- Backfill: create tracking rows for existing users
INSERT INTO public.user_engagement_tracking (user_id, created_at, updated_at)
SELECT u.id, u.created_at, NOW()
FROM auth.users u
LEFT JOIN public.user_engagement_tracking t ON u.id = t.user_id
WHERE t.user_id IS NULL;

-- 4. Reminder check function
--    Finds users eligible for each reminder type and POSTs to the Edge Function via pg_net
--    Reads service role key from Supabase Vault (encrypted at rest)
--    Store key via: SELECT vault.create_secret('<key>', 'supabase_service_role_key', '...');
CREATE OR REPLACE FUNCTION public.check_and_send_reminders()
RETURNS void AS $$
DECLARE
  edge_function_url TEXT := 'https://pcoyafgsirrznhmdaiji.supabase.co/functions/v1/send-reminder-email';
  service_role_key TEXT;
  signup_users JSONB;
  survey_users JSONB;
  chat_users JSONB;
BEGIN
  -- Read key from Supabase Vault (encrypted at rest, only accessible to SECURITY DEFINER)
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key'
  LIMIT 1;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE WARNING 'service_role_key not found in vault — skipping reminders';
    RETURN;
  END IF;

  -- ===== Reminder 1: Signed up but never started survey (24h after signup) =====
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', t.user_id,
    'email', p.email,
    'first_name', COALESCE(p.first_name, 'there')
  )), '[]'::jsonb)
  INTO signup_users
  FROM public.user_engagement_tracking t
  JOIN public.profiles p ON t.user_id = p.id
  WHERE t.survey_started_at IS NULL
    AND t.signup_reminder_sent_at IS NULL
    AND t.created_at < NOW() - INTERVAL '24 hours'
    AND p.email_reminders_enabled = TRUE
    AND p.email IS NOT NULL;

  IF jsonb_array_length(signup_users) > 0 THEN
    PERFORM net.http_post(
      url := edge_function_url,
      body := jsonb_build_object('type', 'signup_no_start', 'users', signup_users),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      )
    );

    UPDATE public.user_engagement_tracking
    SET signup_reminder_sent_at = NOW(), updated_at = NOW()
    WHERE user_id IN (
      SELECT (u->>'user_id')::uuid
      FROM jsonb_array_elements(signup_users) u
    );
  END IF;

  -- ===== Reminder 2: Survey abandoned (24h after last activity, not completed) =====
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', t.user_id,
    'email', p.email,
    'first_name', COALESCE(p.first_name, 'there'),
    'survey_last_section', t.survey_last_section,
    'survey_total_sections', t.survey_total_sections
  )), '[]'::jsonb)
  INTO survey_users
  FROM public.user_engagement_tracking t
  JOIN public.profiles p ON t.user_id = p.id
  WHERE t.survey_started_at IS NOT NULL
    AND t.survey_completed_at IS NULL
    AND t.survey_reminder_sent_at IS NULL
    AND t.survey_last_activity_at < NOW() - INTERVAL '24 hours'
    AND p.email_reminders_enabled = TRUE
    AND p.email IS NOT NULL;

  IF jsonb_array_length(survey_users) > 0 THEN
    PERFORM net.http_post(
      url := edge_function_url,
      body := jsonb_build_object('type', 'survey_abandoned', 'users', survey_users),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      )
    );

    UPDATE public.user_engagement_tracking
    SET survey_reminder_sent_at = NOW(), updated_at = NOW()
    WHERE user_id IN (
      SELECT (u->>'user_id')::uuid
      FROM jsonb_array_elements(survey_users) u
    );
  END IF;

  -- ===== Reminder 3: Chat not completed (24h after last activity or survey complete) =====
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', t.user_id,
    'email', p.email,
    'first_name', COALESCE(p.first_name, 'there'),
    'chat_last_section_index', COALESCE(t.chat_last_section_index, -1)
  )), '[]'::jsonb)
  INTO chat_users
  FROM public.user_engagement_tracking t
  JOIN public.profiles p ON t.user_id = p.id
  WHERE t.survey_completed_at IS NOT NULL
    AND t.chat_completed_at IS NULL
    AND t.chat_reminder_sent_at IS NULL
    AND (
      (t.chat_last_activity_at IS NOT NULL AND t.chat_last_activity_at < NOW() - INTERVAL '24 hours')
      OR
      (t.chat_started_at IS NULL AND t.survey_completed_at < NOW() - INTERVAL '24 hours')
    )
    AND p.email_reminders_enabled = TRUE
    AND p.email IS NOT NULL;

  IF jsonb_array_length(chat_users) > 0 THEN
    PERFORM net.http_post(
      url := edge_function_url,
      body := jsonb_build_object('type', 'chat_not_completed', 'users', chat_users),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      )
    );

    UPDATE public.user_engagement_tracking
    SET chat_reminder_sent_at = NOW(), updated_at = NOW()
    WHERE user_id IN (
      SELECT (u->>'user_id')::uuid
      FROM jsonb_array_elements(chat_users) u
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Schedule the cron job — runs every hour at :17
SELECT cron.schedule(
  'send-engagement-reminders',
  '17 * * * *',
  'SELECT public.check_and_send_reminders()'
);
