-- Ensure pg_net extension is available (for HTTP from Postgres)
create extension if not exists "pg_net" with schema extensions;

-- Helper function to call the analysis-completed Edge Function
create or replace function public._notify_report_completed()
returns trigger
language plpgsql
security definer
as $$
declare
  url text := 'https://pcoyafgsirrznhmdaiji.functions.supabase.co/analysis-completed';
  headers jsonb := jsonb_build_object(
    'Content-Type', 'application/json'
  );
  payload jsonb := jsonb_build_object(
    'report_id', NEW.id
  );
  resp jsonb;
begin
  -- Fire only when status transitions to 'completed'
  if TG_OP = 'UPDATE' and NEW.status = 'completed' and (OLD.status is distinct from NEW.status) then
    -- Asynchronous HTTP POST; ignore response content
    perform extensions.net.http_post(url, headers, payload::text);
  end if;
  return NEW;
end;
$$;

-- Create trigger on reports table
drop trigger if exists trg_notify_report_completed on public.reports;
create trigger trg_notify_report_completed
after update of status on public.reports
for each row
execute function public._notify_report_completed();


