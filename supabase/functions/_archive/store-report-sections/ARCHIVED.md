# Archived: store-report-sections

**Date:** 2026-03-02
**Reason:** This edge function is no longer used in the active pipeline. Both Workflow 1 (Webhook to profile insert) and Workflow 3 (Job ranking to final career sections) now insert directly to the `report_sections` table via Supabase nodes in n8n, bypassing this function entirely.

**Additional context:** The section_type naming in this function (`executive_summary`, `personality_team`, `growth`, `career_suggestion`) does not match the current pipeline naming (`approach`, `strengths`, `development`, `top_career_1`, etc.), confirming it was replaced.

**If something breaks:** Re-check whether any n8n workflow or external service is still POSTing to `/functions/v1/store-report-sections`. If so, restore this function and update the section_type names to match current conventions.
