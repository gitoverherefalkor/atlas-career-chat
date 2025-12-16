# Supabase RLS Security Fixes Required

This document outlines the Row Level Security (RLS) issues identified in the Supabase database that need to be addressed before allowing external test users.

## Critical: Tables with RLS Disabled

The following tables in the `public` schema have RLS disabled, meaning anyone with the database URL could potentially read/write all data:

| Table | Risk Level | Action Required |
|-------|------------|-----------------|
| `public.enriched_jobs` | HIGH | Enable RLS, add read policy for authenticated users |
| `public.sop_vectors` | HIGH | Enable RLS, add appropriate policies |
| `public.prompts` | HIGH | Enable RLS, admin-only write access |
| `public.api_error_logs` | MEDIUM | Enable RLS, admin-only access |
| `public.error_logs` | MEDIUM | Enable RLS, admin-only access |

### How to Fix (Supabase Dashboard)

1. Go to **Database → Tables**
2. For each table listed above:
   - Click on the table name
   - Go to **RLS Policies** tab
   - Click **Enable RLS**
   - Add appropriate policies (see examples below)

### Example RLS Policies

```sql
-- For enriched_jobs (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read enriched_jobs"
ON public.enriched_jobs
FOR SELECT
TO authenticated
USING (true);

-- For prompts (admin-only)
CREATE POLICY "Allow only admins to manage prompts"
ON public.prompts
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- For error_logs (admin-only read)
CREATE POLICY "Allow only admins to read error logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM admin_users));
```

## Performance: Auth RLS Initialization

The following tables have RLS policies that may cause performance issues due to per-row evaluation of auth functions:

| Table | Issue |
|-------|-------|
| `public.access_codes` | Auth function called per row |
| `public.purchases` | Auth function called per row |
| `public.profiles` | Auth function called per row |
| `public.reports` | Auth function called per row |
| `public.report_sections` | Auth function called per row |

### How to Fix

Wrap auth functions in a subquery to ensure they're evaluated once:

```sql
-- Instead of:
USING (auth.uid() = user_id)

-- Use:
USING (user_id = (SELECT auth.uid()))
```

### Example Policy Update

```sql
-- Update existing policy for reports table
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;

CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
```

## Action Checklist

- [ ] Enable RLS on `enriched_jobs` table
- [ ] Enable RLS on `sop_vectors` table
- [ ] Enable RLS on `prompts` table
- [ ] Enable RLS on `api_error_logs` table
- [ ] Enable RLS on `error_logs` table
- [ ] Optimize RLS policies for `access_codes`
- [ ] Optimize RLS policies for `purchases`
- [ ] Optimize RLS policies for `profiles`
- [ ] Optimize RLS policies for `reports`
- [ ] Optimize RLS policies for `report_sections`

## Notes

- These changes must be made directly in the Supabase Dashboard or via SQL migrations
- Test each policy change with a non-admin user account before deploying
- The performance optimizations are recommended but not blocking for test users
