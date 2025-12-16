# Archived Edge Functions

## Relevance-related (migrated to n8n)
- forward-to-relevance
- simple-relevance-test
- test-relevance-with-report-id (config entries only)
- career-sections-completed (unused)

Reason: Replaced by `forward-to-n8n` and n8n Payload webhooks.

## Test/Development Functions (archived Dec 2024)
- test-email - Email testing function
- linkedin-profile - LinkedIn profile fetcher (unused)
- parse-resume-ai - AI resume parser (replaced by frontend)
- test-survey-integration - Survey testing
- test-n8n-integration - N8N webhook testing
- create-test-report - Test report generator
- cleanup-test-reports - Test data cleanup

Reason: Development/testing utilities that should not be deployed to production.

See `supabase/config.toml` for current active functions.


