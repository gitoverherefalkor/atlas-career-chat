-- Support & Feedback requests submitted through the in-app form.
-- Written and read only by the submit-support-request edge function, which
-- uses the service role. RLS is enabled with no policies, making the table
-- service-role-only: the frontend anon key cannot read or write it.

CREATE TABLE IF NOT EXISTS public.support_requests (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   timestamptz NOT NULL DEFAULT now(),
    category     text NOT NULL,
    message      text NOT NULL,
    email        text NOT NULL,
    user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    page         text,
    access_code  text,
    user_agent   text,
    status       text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS support_requests_created_at_idx
    ON public.support_requests (created_at DESC);
