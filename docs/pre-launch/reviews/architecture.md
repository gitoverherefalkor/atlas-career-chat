# Atlas Assessments — Architecture & Code Quality Review

## Strengths

- **Clean component domain split** — `src/components/{assessment, chat, dashboard, jobs, profile, resume, survey, report, auth}/` with hooks colocated where they belong (`survey/hooks`, `resume/hooks`, `assessment/hooks`). For a "vibe-coded" project this is unusually disciplined.
- **Code-splitting done right** — `src/App.tsx:23-39` lazy-loads everything except Index/Payment/NotFound, with an explanatory comment on why Payment stays eager (conversion route). `ChunkLoadErrorBoundary` (`src/components/ChunkLoadErrorBoundary.tsx`) handles the post-deploy stale-chunk problem most projects ignore until it bites them.
- **Edge-function shared helpers exist and are mostly used** — `supabase/functions/_shared/cors.ts` provides `getCorsHeaders`, `handleCorsPreFlight`, `errorResponse`, `verifySharedSecret`, `checkRateLimit`. 16 of 21 functions import them. The origin allow-list + dev-localhost regex is the right pattern.
- **Security headers in `vercel.json` are strong** — strict CSP (no `'unsafe-inline'` script-src), HSTS, X-Frame-Options DENY, Permissions-Policy locking down camera/geolocation. Better than most pre-release SaaS.
- **Supabase types are generated and present** — `src/integrations/supabase/types.ts` is 1,323 lines and recent (`user_engagement_tracking` and `email_reminders_enabled` are in there).
- **AuthProvider handles user-switch storage cleanup** — `src/hooks/useAuth.tsx:43-60` wipes per-user localStorage on user switch. Non-obvious correctness work.

## Critical (blocks release or will explode in production)

### 1. TypeScript strictness is fully off — `tsconfig.app.json:18-22`
```json
"strict": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitAny": false,
```
And `tsconfig.json:12-17` explicitly sets `strictNullChecks: false`. **The type system is effectively decoration.** 70 `: any` declarations and 15 `as any` escape hatches across `src/` are downstream of this. For a non-technical owner who depends on the compiler to catch mistakes during refactors, this is the single highest-impact fix. Flip `"strict": true`, accept ~200 errors, fix them over a week. Most will be trivial null guards.

### 2. Zero tests — `package.json` has no `test` script
No `*.test.ts`, no `__tests__`, no `vitest`/`jest` dep. For an app handling payments (Stripe), user data (GDPR/export endpoints, `delete-user-data`), assessment scoring routed through n8n, and a chat that can fail in 10 ways — this is genuinely risky. Minimum viable safety net before public launch: 1 test per edge function happy-path + the access-code verification flow + `useEngagementTracking` upsert. Use Vitest (matches Vite). Even 15 tests would prevent the most likely regressions.

### 3. Mixed Supabase service-role env var names — leak risk if rotated
Edge functions use **two different env vars** for the same thing:
- `SUPABASE_SERVICE_ROLE_KEY` — `auth-callback`, `chat-session-complete`, `delete-user-data`, `deliver-section`, `export-user-data`, `submit-chapter-feedback`, `wrap-up-extract`, `wrap-up-save`
- `NEW_N8N_SERVICE_ROLE_KEY` — `analysis-completed`, `forward-to-n8n`, `payment-success`, `search-jobs`, `signup-with-access-code`, `verify-access-code`

The "NEW_" prefix suggests a half-completed key rotation. **Today, if you rotate one and forget the other, half your app silently 500s.** Pick one name, update Supabase Edge Function secrets, search/replace the codebase, document in `.env.example` (which currently lists none of these — it only has VITE_ vars).

### 4. CSP allows Stripe script but no Stripe.js is in the bundle — and `vercel.json` allows `cdnjs.cloudflare.com` for scripts purely for PDF.js worker
`vercel.json:11` has `script-src 'self' https://js.stripe.com https://cdnjs.cloudflare.com`. The cdnjs allowance is for `pdfjs-dist`'s worker (`src/components/resume/utils/clientSidePdfParser.ts:5`). **But `clientSidePdfParser.ts` is never imported** (see dead code below). So you're (a) allowing a third-party CDN in your CSP for a feature you don't ship, and (b) shipping the `pdfjs-dist` npm dep — a ~10MB package — for nothing. Remove the dep, then tighten the CSP to drop cdnjs.

### 5. RLS gaps already known and unfixed — `docs/SUPABASE_RLS_FIXES.md`
Five public tables (`enriched_jobs`, `sop_vectors`, `prompts`, `api_error_logs`, `error_logs`) have RLS disabled per the team's own doc. `prompts` and `error_logs` are the scariest — anyone with the anon key could read your system prompts and your error stream (which may leak email addresses, user IDs, internal n8n state). Before opening signup to the public, run the four `CREATE POLICY` statements at the bottom of that doc.

## Important (tech debt that compounds fast)

### 6. Two parallel resume-upload code paths, both alive
- `useResumeUpload` (`src/components/resume/hooks/useResumeUpload.ts`) → calls edge fn `parse-resume` → writes raw text to `profiles.resume_data`. Used **only** by `ResumeUploadCard` → `Profile`.
- `useAIResumeUpload` (`src/components/resume/hooks/useAIResumeUpload.ts`) → uploads to Storage → calls `forward-resume-to-n8n` → n8n returns structured data. Used by `PreSurveyUpload` (Assessment flow).
- A **third** edge function `parse-resume-ai` exists and is referenced by `src/components/resume/utils/aiResumeParser.ts`, which is **not imported anywhere**. The function is orphaned.
- The pre-fill side mirrors this: `useResumePreFill` is a 16-line wrapper that just re-exports `useAIResumePreFill`. Vestigial indirection.

**Action:** decide one path. Likely the AI/n8n one is canonical and `parse-resume` + `useResumeUpload` + `aiResumeParser.ts` + `clientSidePdfParser.ts` + `resumeTextExtractor.ts` + the `pdfjs-dist` dep all go.

### 7. `: any` casts on tables that ARE in the generated types
Examples that should just be deleted now:
- `src/hooks/useEngagementTracking.ts:18` — `.from('user_engagement_tracking' as any)` — table is fully typed at `types.ts:893`.
- `src/pages/Chat.tsx:95, 206` — same table, same workaround.
- `src/pages/Profile.tsx:33, 46, 386` — `(profile as any)?.email_reminders_enabled` — field is at `types.ts:455`.
- `src/hooks/useLanguage.ts:43` — `.update({ preferred_language: lng } as any)` — also typed.
- `src/hooks/useAuth.tsx:96`, `src/components/resume/hooks/useAIResumeUpload.ts:133`, `src/components/CheckoutForm.tsx:188`.

A simple sweep removes ~10 lies from the codebase.

### 8. Two toast systems coexist — `useToast` (shadcn) AND `sonner`
`src/components/CheckoutForm.tsx:5-6` imports **both** and uses both in the same file. `src/App.tsx:73-74` mounts both `<Toaster />` and `<Sonner />`. Pick one. 24 files use shadcn vs 1 uses sonner, so the realistic move is delete sonner.

### 9. Edge function dependency versions drift
Three different `deno.land/std` versions across functions: `0.168.0`, `0.190.0`, `0.224.0`. Three different `supabase-js` versions: `2.45.4`, `2`, `2.49.4`. Pin everyone to canonical versions.

### 10. Five edge functions skip the shared CORS helpers
`auth-callback`, `send-reminder-email`, `submit-chapter-feedback`, `wrap-up-extract`, `wrap-up-save` either don't import `_shared/cors` or roll their own CORS headers inline. Reformat them to the standard pattern.

### 11. `Chat.tsx` is 557 lines + `ChatContainer.tsx` is 857 lines + `ChatMessage.tsx` is **1100 lines**
Post-launch sprint 1: split into `ChatMessage.tsx` (shell) + `CollapsibleCareerBlocks.tsx` + `SequentialSubsections.tsx` + `ChipOptions.tsx`. Target: no file in `chat/` over 400 lines.

### 12. `Dashboard.tsx` (570) and `Profile.tsx` (505) are doing too much
Extract into `useDashboardState.ts`, `useDraftAnswers.ts`, `DashboardModals.tsx`.

### 13. `pages/Index.tsx` is 1011 lines because all the marketing components are inlined
Move inline `Button`, `CareerPathBg`, `VideoPlaceholder`, `ScreenshotPlaceholder`, `ImagePlaceholder` to `src/components/landing/`.

### 14. Inconsistent error handling — 67 `try/catch` blocks, 63 `toast(` calls, 132 `console.*` statements with no centralization
There's no `lib/errors.ts` or `lib/logger.ts`. Write a 30-line `lib/errors.ts` exporting `handleError(error, userMessage)` that does `console.error` + toast + (optional) Sentry hook.

## Minor (cleanup)

### 15. Dead components and pages
- `src/components/Hero.tsx` (110 lines) — only matched in `HpTryout.tsx` as a comment
- `src/components/Pricing.tsx` (80 lines)
- `src/components/WhyAtlas.tsx`
- `src/pages/HpTryout.tsx` (232 lines) — not in `App.tsx` routes
- `src/pages/ColorTest.tsx` (232 lines) — only behind `/color-test`; useful in dev, but ship-blocker. Either gate behind `NODE_ENV !== 'production'` or remove.
- `src/components/resume/utils/aiResumeParser.ts`, `clientSidePdfParser.ts`, `resumeTextExtractor.ts`

### 16. `package.json` package name is `vite_react_shadcn_ts`
The default Lovable scaffold name. Rename to `atlas-assessments` or `cairnly-web`.

### 17. README is the Lovable boilerplate
For a project with a real domain (`cairnly.io`) and rich `CLAUDE.md` context, the public README is misleading and explains nothing about the architecture.

### 18. `lovable-tagger` plugin still in `vite.config.ts:4,15`
Dev-only plugin from Lovable's stack. Make sure your CSP wouldn't ever ship that mode to prod.

### 19. Migration naming is inconsistent
Don't rename the old ones, but every new migration should follow the descriptive pattern.

### 20. `bun.lockb` AND `package-lock.json` both committed
Pick one package manager.

### 21. `openai` npm package is dead in the frontend
`package.json:57` declares `openai: ^5.8.2`. Zero imports in `src/`. Remove the dep.

### 22. `chat_last_section_index: 10` hardcoded magic number
`src/hooks/useEngagementTracking.ts:86` — export `ALL_SECTIONS.length - 1` from `ReportSidebar.tsx` and use it.

## Pre-launch / post-launch hygiene checklist

**Pre-launch (must do before opening signup):**
- [ ] Apply the RLS policies from `docs/SUPABASE_RLS_FIXES.md` to the 5 unprotected tables
- [ ] Pick one service-role env-var name; align all 15 edge function references
- [ ] Remove `openai` and `pdfjs-dist` from `package.json`; delete dead client-side PDF parser; tighten CSP to drop `cdnjs.cloudflare.com`
- [ ] Add one smoke-test per edge function (or at minimum a manual checklist in `docs/`)
- [ ] Update `README.md` with real setup steps
- [ ] Decide on resume-upload path; delete the loser plus `parse-resume-ai` edge function if orphaned
- [ ] Gate `/color-test` behind `import.meta.env.DEV` or remove
- [ ] Delete `src/pages/HpTryout.tsx`, `src/components/Hero.tsx`, `src/components/Pricing.tsx`, `src/components/WhyAtlas.tsx`

**Post-launch (sprint 1):**
- [ ] Flip `"strict": true` in `tsconfig.app.json`; fix the resulting errors
- [ ] Sweep `as any` from typed tables (~10 lines, mechanical)
- [ ] Pick one toast system; delete the other
- [ ] Align edge-function `deno/std` and `supabase-js` versions
- [ ] Add Vitest + write 15 tests covering payment flow, access-code verify, engagement upsert, useReports, useReportSections
- [ ] Standardize edge functions on `_shared/cors.ts` (5 stragglers)

**Post-launch (sprint 2):**
- [ ] Centralize error handling in `lib/errors.ts` + `lib/logger.ts`; migrate incrementally
- [ ] Split `ChatMessage.tsx` into sub-components (target <400 LOC each)
- [ ] Extract `Dashboard.tsx` and `Index.tsx` sub-components
- [ ] Sentry or similar
