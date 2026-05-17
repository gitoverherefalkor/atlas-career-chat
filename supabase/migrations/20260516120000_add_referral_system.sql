-- Referral / virality system.
--
-- Each user gets one personal invite code (which is also created as a Stripe
-- promotion code worth 25% off). When an invitee completes a €39 purchase
-- using that code, the payment-success edge function writes a row into
-- `referrals` (service role only). Inviters unlock one premium feature per
-- successful referral.

-- 1. Profile columns -------------------------------------------------------
-- referral_code: the user's personal invite code (also the Stripe promotion
--   code string). stripe_promotion_code_id: the Stripe promo object id, stored
--   so we never re-create it.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT;

-- referral_code IS the Stripe promotion code string, so it must be globally
-- unique. Partial index so the many existing NULL rows don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- 2. Referrals table -------------------------------------------------------
-- One row per completed referred purchase.
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The invitee. Nullable: at purchase time the invitee usually has no account
  -- yet (they pay first, sign up after).
  invitee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_email TEXT,
  -- The Stripe checkout session of the referred purchase. UNIQUE — this is the
  -- idempotency key: webhook retries / duplicate success calls credit once.
  stripe_session_id TEXT NOT NULL,
  promotion_code_used TEXT,
  amount_paid NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referrals_stripe_session_id_key UNIQUE (stripe_session_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id
  ON public.referrals (referrer_user_id);

-- 3. RLS -------------------------------------------------------------------
-- A user may READ referrals where they are the referrer (this powers the
-- unlock count on the dashboard). All writes are service-role only — referral
-- credit can only be minted by payment-success after Stripe confirms payment.
-- This is the core anti-abuse boundary: the browser can never write here.
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'referrals'
      AND policyname = 'Users can view their own referrals'
  ) THEN
    CREATE POLICY "Users can view their own referrals"
      ON public.referrals FOR SELECT
      USING (auth.uid() = referrer_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'referrals'
      AND policyname = 'Service role full access on referrals'
  ) THEN
    CREATE POLICY "Service role full access on referrals"
      ON public.referrals FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

COMMENT ON TABLE public.referrals IS
'One row per completed referred purchase. Written only by the payment-success edge function (service role). Inviters unlock one feature per row.';
