-- Admin danger zone view: quickly identify users for deletion from Auth UI.
-- All foreign keys to auth.users already CASCADE, so deleting from
-- Authentication → Users in the Supabase dashboard wipes all related data
-- (profiles, reports, report_sections, chat_messages, engagement tracking).
-- Storage (resume files) must still be cleaned up separately.

CREATE OR REPLACE VIEW public.admin_user_danger_zone AS
SELECT
  -- Identifying info (first columns as requested)
  COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    '(no name)'
  ) AS name,
  u.email,
  COALESCE(u.raw_app_meta_data->>'provider', 'email') AS sign_on_method,

  -- Status flags
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  EXISTS (SELECT 1 FROM public.access_codes ac WHERE ac.user_id = u.id AND ac.is_used) AS has_paid,
  (SELECT COUNT(*) FROM public.reports r WHERE r.user_id = u.id) AS report_count,
  (SELECT MAX(r.status::text) FROM public.reports r WHERE r.user_id = u.id) AS latest_report_status,
  (SELECT et.chat_completed_at IS NOT NULL FROM public.user_engagement_tracking et WHERE et.user_id = u.id) AS chat_completed,

  -- Timestamps
  u.created_at AS signed_up_at,
  u.last_sign_in_at,

  -- UUID last (for copy-paste when needed)
  u.id AS user_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

COMMENT ON VIEW public.admin_user_danger_zone IS
  'Admin-only view for identifying users. Delete users via Authentication → Users in the Supabase dashboard — all related data cascades automatically. Resume files in storage must be cleaned up separately in the resumes bucket folder named after the user_id.';

-- Restrict to service_role only (admin queries via dashboard use postgres role which bypasses RLS)
REVOKE ALL ON public.admin_user_danger_zone FROM anon, authenticated;
GRANT SELECT ON public.admin_user_danger_zone TO service_role;
