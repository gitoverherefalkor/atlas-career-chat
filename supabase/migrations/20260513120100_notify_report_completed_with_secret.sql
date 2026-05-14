-- Update the report-completed trigger to authenticate its call to
-- analysis-completed with the n8n shared secret.
--
-- Why: the edge function now fails closed when N8N_SHARED_SECRET is unset.
-- Without this update, the trigger's pg_net call would be rejected and the
-- "report ready" email would silently stop firing.
--
-- Setup required (one-off, per environment):
--   SELECT vault.create_secret('<same value as N8N_SHARED_SECRET env var>',
--                              'n8n_shared_secret',
--                              'Shared secret for n8n callbacks');

CREATE OR REPLACE FUNCTION public._notify_report_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  url TEXT := 'https://pcoyafgsirrznhmdaiji.functions.supabase.co/analysis-completed';
  shared_secret TEXT;
BEGIN
  -- Fire only when status transitions to 'completed'
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT decrypted_secret INTO shared_secret
    FROM vault.decrypted_secrets
    WHERE name = 'n8n_shared_secret'
    LIMIT 1;

    IF shared_secret IS NULL OR shared_secret = '' THEN
      RAISE WARNING 'n8n_shared_secret not found in vault — skipping analysis-completed notify for report %', NEW.id;
      RETURN NEW;
    END IF;

    PERFORM extensions.net.http_post(
      url := url,
      body := jsonb_build_object('report_id', NEW.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-shared-secret', shared_secret
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
