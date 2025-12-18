# Post Test User - Reversion Checklist

This document outlines changes made specifically for test user phase that should be reviewed/reverted when transitioning to full production with real payments.

## Database Changes

### Access Codes Table - Test User Setup

**What was done:**
Added three columns to `access_codes` table to support bypass payment for test users:

```sql
-- Columns added on 2025-12-18
ALTER TABLE public.access_codes
ADD COLUMN discount_percent integer NULL DEFAULT 0,
ADD COLUMN bypass_payment boolean NULL DEFAULT false,
ADD COLUMN is_active boolean NULL DEFAULT true;

-- Made expires_at nullable so test codes don't need expiration
ALTER TABLE public.access_codes
ALTER COLUMN expires_at DROP NOT NULL;
```

**Test code created:**
```sql
-- Test access code for beta testers (50 uses, no expiration, bypasses payment)
INSERT INTO access_codes (code, discount_percent, bypass_payment, max_usage, is_active)
VALUES ('BETATEST2024', 100, true, 50, true);
```

**What to do before production:**

1. **Deactivate test codes** - Set `is_active = false` for all test codes:
   ```sql
   UPDATE access_codes
   SET is_active = false
   WHERE bypass_payment = true OR code = 'BETATEST2024';
   ```

2. **Review columns** - Decide if you want to keep these columns for future promotions:
   - `discount_percent` - Could be useful for future discount codes
   - `bypass_payment` - Could be useful for comp'd assessments
   - `is_active` - Useful for disabling codes without deleting them

   **Recommendation:** Keep all three columns, they're useful for flexibility.

3. **Restore expires_at NOT NULL** (optional):
   ```sql
   -- Only if you want all future codes to require expiration dates
   -- First set expires_at for any null values
   UPDATE access_codes
   SET expires_at = NOW() + INTERVAL '1 year'
   WHERE expires_at IS NULL AND is_active = true;

   -- Then add NOT NULL constraint back
   ALTER TABLE public.access_codes
   ALTER COLUMN expires_at SET NOT NULL;
   ```

## Edge Function Changes

### verify-access-code Function

**What was changed:**
- Added check for `is_active` column (lines 57-67)
- Made `expires_at` check conditional - only checks if value exists (line 70)

**File:** `supabase/functions/verify-access-code/index.ts`

**What to do before production:**
- **NO REVERSION NEEDED** - These changes improve the function and should stay in production
- The `is_active` check is valuable for managing codes
- The nullable `expires_at` check provides flexibility

## Stripe Configuration

**What was done:**
- Switched from test mode (`sk_test_...`) to live mode (`sk_live_...`)
- Updated Supabase Edge Function secret: `STRIPE_SECRET_KEY`

**What to do before production:**
- **NO REVERSION NEEDED** - You're already in production mode
- Test mode is only for development/testing

## n8n Webhooks

**What was done:**
- Updated production webhook URLs:
  - `.env` file: Removed unused `VITE_N8N_WEBHOOK_TRIGGER_URL`
  - `.env` file: `VITE_N8N_CHAT_WEBHOOK_URL` already production
  - Supabase secret `N8N_WEBHOOK_URL` updated to production survey payload webhook
  - Removed unused Supabase secret `N8N_WEBHOOK_TRIGGER_URL` (old edge function)

**What to do before production:**
- **NO REVERSION NEEDED** - Production webhooks should stay in production

---

## Summary

**Only 1 action needed before full production:**
1. Deactivate test access codes (`BETATEST2024` and any others with `bypass_payment = true`)

Everything else can stay as-is - the changes add flexibility and are production-ready.

---

*Document created: 2025-12-18*
*Last updated: 2025-12-18*
