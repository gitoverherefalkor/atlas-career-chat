-- Atomic access-code consumption RPC.
--
-- Why: usage_count was previously incremented twice (read-then-write in two
-- separate hooks), and the read-then-write itself was racy. This RPC does
-- the increment in one round-trip and is the single source of truth.
--
-- Returns: the updated row, or NULL if the code is missing / exhausted /
--          not owned by the calling user.

CREATE OR REPLACE FUNCTION public.consume_access_code(p_code_id UUID)
RETURNS TABLE (
    id UUID,
    code TEXT,
    usage_count INT,
    max_usage INT,
    used_at TIMESTAMPTZ,
    user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    UPDATE public.access_codes ac
    SET
        usage_count = ac.usage_count + 1,
        used_at = NOW()
    WHERE ac.id = p_code_id
      -- Bind to the caller if not already bound, OR enforce ownership if bound.
      AND (ac.user_id IS NULL OR ac.user_id = v_caller)
      -- Don't allow consuming beyond max_usage.
      AND ac.usage_count < ac.max_usage
      AND COALESCE(ac.is_active, TRUE) = TRUE
      AND (ac.expires_at IS NULL OR ac.expires_at > NOW())
    RETURNING ac.id, ac.code, ac.usage_count, ac.max_usage, ac.used_at, ac.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_access_code(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_access_code(UUID) TO authenticated;

COMMENT ON FUNCTION public.consume_access_code(UUID) IS
'Atomically increment usage_count on an access code. Caller must be authenticated. Returns the updated row or empty if missing/exhausted/not-owned.';
