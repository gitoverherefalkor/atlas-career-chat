-- Make purchases.stripe_session_id UNIQUE.
--
-- Why: payment-success can be called multiple times for the same Stripe
-- session — once via the success page, again via the Stripe webhook, and
-- potentially again if Stripe retries the webhook. Without UNIQUE, each
-- call inserts a new purchases row and mints a duplicate access code.
-- With UNIQUE, the second insert errors and the app code can short-circuit
-- to idempotent behaviour.
--
-- We don't normalize stripe_session_id (no lowercasing etc.) because
-- Stripe session IDs are opaque tokens — exact-match comparison is correct.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'purchases_stripe_session_id_key'
          AND conrelid = 'public.purchases'::regclass
    ) THEN
        ALTER TABLE public.purchases
        ADD CONSTRAINT purchases_stripe_session_id_key
        UNIQUE (stripe_session_id);
    END IF;
END $$;
