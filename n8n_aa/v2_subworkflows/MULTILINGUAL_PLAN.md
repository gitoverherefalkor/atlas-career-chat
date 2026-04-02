# Multilingual Support Plan — Starting with Dutch

## Principle
**English in, translate on the way out.** All n8n prompts, scoring, and analysis stay in English. Translation happens only on user-facing content before it reaches the user.

---

## Phase 1: Language Infrastructure

### 1a. Database
```sql
ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
ALTER TABLE report_sections ADD COLUMN language TEXT DEFAULT 'en';
```

### 1b. Language selection at signup
Add language dropdown to `src/components/auth/EmailPasswordForm.tsx`:
- English (default)
- Nederlands

Store in `profiles.preferred_language`.

### 1c. Pass language through the pipeline (Option B — metadata)
`supabase/functions/forward-to-n8n/index.ts` reads `preferred_language` from profile and includes it in the n8n payload. It flows through WF1 → WF2 → WF3 → WF4 as part of the data. No extra DB calls.

---

## Phase 2: Report Translation (WF1 + WF4)

Translation happens **just before each Supabase insert** — after all English AI processing is complete.

### WF1 (Personality Profile)
```
extract_report_sections_code → [Translate if needed] → SB insert all sections
```

### WF4 (Career Recommendations)
Same pattern before Insert Top 3, Insert Runner Ups, Insert dream.

### Translation node logic
- Check `preferred_language` from pipeline data
- If `en`: pass through unchanged
- If `nl`: call Gemini Flash with translation prompt
- Preserve HTML formatting (`<h5>` tags, `<strong>`, etc.)
- Store with `language: 'nl'` column on `report_sections`

### Speed impact
~15-20 seconds total (Gemini Flash, ~2s per section). Negligible on a 6-10 min pipeline.

---

## Phase 3: Chat Agent — Clone Approach

**Don't modify the English agent.** Clone it as a Dutch agent.

### Setup
1. Duplicate WF5 (Atlas Chat) in n8n → "WF5-NL Atlas Chat (Dutch)"
2. Translate the full system prompt:
   - All boilerplate intros/outros to Dutch
   - SOP instructions to Dutch
   - Banned words list adapted for Dutch
   - Add: "All your responses must be in Dutch (Nederlands)"
3. Same Supabase tools (approach, strengths, etc.) — they return pre-translated Dutch content from Phase 2
4. Same feedback tool (fb_unified) — feedback can stay in the language the user writes
5. Same memory, same recovery tool

### Routing
Frontend sends `preferred_language` in chat metadata. Two options:

**Option A (simplest):** Two webhook URLs. Frontend picks the right one based on user's language setting.

**Option B (single entry point):** Router workflow: Webhook → If `language == 'nl'` → Execute Dutch Agent, else → Execute English Agent.

### What the Dutch agent gets for free
- Report sections already in Dutch (from Phase 2 translation)
- User writes in Dutch, agent responds in Dutch
- Feedback captured in Dutch (natural)
- No translation nodes needed in chat flow

---

## Phase 4: Frontend (Deferred)

Platform UI (buttons, labels, navigation) stays English for now. Dutch professionals read English UI fine. Survey questions stay English for AI quality.

If needed later: `react-i18next` with JSON translation files.

---

## Files to Modify

### Supabase
- Migration: `preferred_language` on profiles, `language` on report_sections

### Frontend
- `src/components/auth/EmailPasswordForm.tsx` — language dropdown
- `src/hooks/useN8nWebhook.ts` — pass language in chat metadata, pick correct webhook URL
- `supabase/functions/forward-to-n8n/index.ts` — read language from profile, include in payload

### n8n (via API, not manually)
- **WF1**: Add conditional translation node before SB insert
- **WF4**: Add conditional translation nodes before each insert
- **WF5-NL**: Clone of WF5 with Dutch system prompt + SOP

### NOT modified
- All English prompts (scoring, analysis) — untouched
- WF2, WF3 — no user-facing content, no changes
- WF5 English agent — completely untouched
- Survey questions — stay English

---

## Implementation Order
1. Database migrations (language columns)
2. Frontend: language selection at signup + pass through pipeline
3. WF1 + WF4: translation nodes (conditional, only fires for non-English)
4. Clone WF5 → WF5-NL with translated system prompt
5. Frontend: route chat to correct webhook based on language
6. End-to-end test with Dutch test user

---

## Workflow Architecture Reference (current state)

```
WF1 (Lean Profile Insert) → WF2 (Source to Enrich 15) → WF3 (Scoring + OOB) → WF4 (Content Generation)
                                                                                       ↓
                                                                              WF5 (Chat Agent)
```

- WF1 ID: nupGvBByAGh4A9tL
- WF2 ID: vVv0tsnFlBnarMdq
- WF3 ID: LJA5JPHvnqhA36Oh
- WF4 ID: pXlzC6vuG7TO28oQ
- WF5 (Chat): h7ie9zN080IM2g7N
- Error Handler: FbsruPbuZI2Fgtc8
- n8n instance: https://falkoratlas.app.n8n.cloud
- Supabase project: pcoyafgsirrznhmdaiji
