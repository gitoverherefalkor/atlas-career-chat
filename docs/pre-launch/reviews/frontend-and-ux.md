# Frontend Pre-Release Review — Atlas Assessments

## Strengths

- **Solid lazy-loading split** in `src/App.tsx` with deliberate eager-loading of `/payment` (commented well — that's good engineering judgment, not premature optimization).
- **Chat resilience**: `ChatContainer.handleSend` has thoughtful retry affordance, optimistic toast on background fb_unified, and a fast-path/agent-path fallback in `src/components/chat/ChatContainer.tsx:558-639`. Bookmarks, wrap-up rehydration, and stale-session detection are all considered.
- **Processing screen** (`src/pages/ReportProcessing.tsx`) is excellent: animated stepper, soft-warning at 3 min, end-state at 5 min, polling on Supabase, and a calm "you can leave this page" message. This is one of the most polished surfaces in the app.
- **Survey UX**: autosave indicator, sticky mobile nav at `SurveyForm.tsx:662`, milestone encouragement banners at 25/50/75/90 percent, animated section-complete flash, keyboard-Enter advance (with textarea exception), and ErrorBoundary inline. Genuinely thoughtful.
- **Locked-state preview** in `src/components/report/ReportPreview.tsx` and the `locked` mode in `PersonalityRadar`/`CareerQuadrant` give a clear "what you'll get" picture before the user runs the assessment.
- **Auto-resize textarea** at `src/components/survey/QuestionRenderer.tsx:103-132` is correct: sets `height='auto'` first, then `scrollHeight`, with min-height clamp, `overflow:hidden`, and re-runs on every value change. No jank.

## Critical (broken UX, blocks release)

1. **Hardcoded `dark` class on `<html>` defeats the i18next/theming setup AND the `darkMode: ["class"]` config is misused** — `src/App.tsx:62-67`. `ThemeScopeGuard` permanently adds the `dark` class to drive the editorial palette via CSS variables. The dashboard then has to work around it with hardcoded hex (`src/pages/Dashboard.tsx:345`: `text-[#F5F5F5]`). This is a fragile pattern: every new component will appear to "be in dark mode" when it isn't. Any shadcn primitive that relies on `dark:` variants will silently get unintended styling. Impact: many components show inconsistent text colors on the teal-navy canvas; new contributors will paint themselves into corners. Fix: rename the class (`.atlas-editorial`) and decouple from Tailwind's reserved `dark` modifier, or actually implement a real palette.

2. **i18n is half-built** — `src/i18n.ts:28-30` declares `supportedLngs: ['en']` only, and `LanguageSwitcher` is disabled per the comment. But Dutch JSON files exist in `public/locales/nl/`, Index/ForgotPassword use `useTranslation`, and EmailPasswordForm uses `t()`. Result: only 4 components use translations; everything else is hardcoded English. Switching language does nothing for ~95% of the app. Impact: shipping a `nl` build today produces broken mixed-language pages. Fix before launch: either commit fully to English-only (delete `nl/` files and `LanguageSwitcher`) or finish the Dutch translation pass — don't ship in the in-between state.

3. **`useReports` error is silently ignored on Dashboard** — `src/pages/Dashboard.tsx:37` destructures only `reports` and `isLoading`. If the report query fails (RLS hiccup, network), the user lands in a "Welcome / no report yet" state and may re-pay or re-run the assessment. Same in `useReportSections` consumers. Fix: surface a toast and an inline retry on Dashboard when `error` is set.

4. **`Chat.tsx:33-38` stale-session detection uses a 72h window**, but if the user's session is stale the chat still mounts a `sessionId` and proceeds. The auto-resume message `"Hi, I'm back!"` fires even though n8n's session likely got garbage collected on the backend — the agent has no memory of "where they left off." Users will see the bot ask them to recap. Verify n8n session lifetime matches 72h, or shorten this client-side window.

5. **Keyboard Enter handler is a global document listener** — `SurveyForm.tsx:312-369` attaches `keydown` to `document`. Combined with the radix dialog primitives (e.g., `ChapterFeedbackModal`), an Enter inside a modal text field can bubble out and trigger survey navigation. Listener should be scoped to the survey root, and should check `event.defaultPrevented` or use `event.target.closest('[role=dialog]')` to bail.

6. **`Assessment.tsx:58-66` unauthenticated state shows just a text line** — `"Authentication required. Please sign in."` with no link, no automatic redirect, no button. Users who deep-link or whose session expires sit on a useless page. Fix: redirect to `/auth` like `Dashboard.tsx` does at line 281-282, or render a `<Button onClick={() => navigate('/auth')}>` CTA.

## Important (looks unprofessional, hurts conversion)

7. **No skip-to-content link, no `<main>` landmark anywhere.** Search across `src/` returned zero `sr-only` skip links outside shadcn primitives. Keyboard users tabbing into the app must traverse the nav on every page. Add a skip link in `App.tsx` and wrap each page's content in `<main>`.

8. **Resume upload — description says PDF only, accepts more, and there's no drag-drop** — `ResumeUploadCard.tsx:19` description: "Upload your PDF, Word document (.doc, .docx) or plain text resume." Good. But the styled dashed border (`line 109`) looks like a drop zone, yet has no `onDrop`/`onDragOver` handlers — users will try and fail. Either wire up drag-drop (10 lines) or remove the dashed border so it doesn't imply it. Also: no progress percentage during upload, just `isProcessing` spinner — for 5-10MB files on slow connections this feels frozen.

9. **Chat input is `position: fixed` with hand-rolled `<style>` injection** — `ChatInput.tsx:88-94`. On mobile (iOS Safari especially), `position: fixed` + on-screen keyboard is notoriously janky; the input can end up behind the keyboard. The Chat page doesn't use `dvh` units or `visualViewport` API. Users will likely lose access to the send button on iPhone when typing. Test on real iOS device and consider `position: sticky` inside the flex column instead.

10. **Dashboard text contrast issues** — `Dashboard.tsx:345` (`text-[#F5F5F5]` welcome on teal-navy) is fine, but `text-gray-500` (`line 367`, `line 376`, `line 388-407`) on the `bg-gray-50` Card or on cream cards may fail WCAG AA. The "Coming Soon" rows and provenance line use `text-gray-400`/`gray-500` which can be 3:1 or below depending on actual rendered backgrounds. Run an automated contrast pass before launch (axe DevTools).

11. **Chat session banner uses a literal `x` character as close button** — `Chat.tsx:480`. It's not even an X icon (`<X />` from lucide), it's the lowercase letter `x`. Looks like a typo in production. Fix: `<X className="h-4 w-4" />`.

12. **Dashboard imports `Play, Search, PlusCircle` but most "Quick Actions" are "Coming soon" disabled buttons** — `Dashboard.tsx:387-408`. Four disabled buttons with `cursor-not-allowed` and no tooltip explaining when they're coming. For a paid product (€39), advertising 4 unavailable features in the post-purchase view reads as unfinished. Hide them or add an ETA/waitlist.

13. **Survey access code redirect dead-end** — `AccessCodeVerification.tsx:47-51`: when `apiError` is set, the user sees a generic "Failed to verify..." with no retry mechanism beyond pressing the button again. No detection of "code already used" vs "invalid code" vs "network error" — `data.error` is rendered verbatim from the edge function. Wrap with friendlier copy and explicit retry button.

14. **No empty state when `reports` exists but `reportSections` is empty** — `Dashboard.tsx:497` checks `latestReport` truthy but doesn't guard against the section data still loading. The `ReportDisplay` will mount with `sections=[]` and render its chapter columns empty. Brief flash but unprofessional. Use `reportSections.length === 0 && isLoading` skeleton.

15. **Sign-in path uses `local` scope for signOut** — `Dashboard.tsx:215` — the comment acknowledges "other devices stay alive until they expire naturally — acceptable UX for our flow." Fine for now, but: the user is not told. Add to Profile/Sign Out copy: "Sign out of this device" so users with shared computers understand.

16. **Hard-coded `useQueryClient` defaults** — `App.tsx:53` instantiates `new QueryClient()` with zero config. No `staleTime`, no retry policy. `useReports` will refetch on every window focus, causing dashboard flicker. Set sensible defaults (`staleTime: 30_000`, `refetchOnWindowFocus: false`).

17. **143 hardcoded hex codes** across `src/components/` and `src/pages/` (rough grep). Tailwind config exposes `atlas-*` tokens but the brand teal/navy/cream are scattered as raw hex (`#27A1A1`, `#213F4F`, `#F5F5F5`, `#374151`...). Maintainability/dark-mode hazard. Audit and replace with tokens.

18. **Chat input doesn't expose a "stop generation" button** — agent calls can take 30s. `useN8nWebhook` likely uses fetch without an abort signal exposed to UI. The user has no way to cancel a slow response and re-prompt. Either show a Stop button while `isWaitingForResponse`, or shorten the timeout with clear retry.

## Minor (polish)

- `Chat.tsx:443` logo is `h-20 sm:h-28` inside a header — on mobile that's 80px tall just for branding. Tighten on small screens.
- `Dashboard.tsx:299-301` `displayName` falls back to `user.email` but `displayName` is then unused except as a comment-mentioned label. Dead code.
- `Chat.tsx:545-557` has 13 lines of dead n8n widget commented-out boilerplate. Remove (git history preserves it).
- `SurveyForm.tsx:38-58` milestone array has English-only strings; if i18n is finished, move to locale file.
- `PersonalityRadar.tsx:332-335` locked-state description says "Available after your assessment." but the placeholder when sections < 3 (transient post-assessment) says "Calibrating your profile…". Two visually similar empty states with very different meanings — consider one unified empty state pattern.
- `ChatInput.tsx:103-113` mic button doesn't have an `aria-pressed` state for `isListening`, so screen readers don't announce recording state.
- `QuestionRenderer.tsx:149-164` uses `navigator.userAgent` regex for mobile detection — brittle. Use `matchMedia('(pointer: coarse)')` or just the touch + screen-width check it already has.
- `Dashboard.tsx:103` scroll uses 50ms timeout to wait for modal to unmount — fragile, swap for `flushSync` or imperatively pass a callback when the modal close animation ends.
- `Auth.tsx` lacks `Helmet`/`<title>` for SEO; same across most pages. Set page titles before launch.
- Chat copy `"Session restored - your coach remembers the conversation"` reassures, but if the n8n session actually expired (>72h), this lie damages trust. Cross-check actual n8n session lifetime.
- `ChatMessages.tsx:118-120` `scrollIntoView({behavior:'smooth'})` ignores `prefers-reduced-motion`. Wrap with that media query.

## Pre-launch QA checklist (manual smoke)

1. **Sign up cold (incognito)**: pay → access code in email → sign up via `/auth?code=…` → dashboard appears with "Start Your Assessment" → access code modal opens → survey → submit → processing screen polls → chat opens → finish chat → report shows. No 404s, no spinners that never resolve.
2. **Refresh mid-survey at section 3, question 4**: survey reloads at the same question with answers intact. Verify `assessment_session` localStorage and Supabase `answers.status='draft'` agree.
3. **Refresh mid-chat after 2 messages**: messages persist, no duplicate "Hi I'm back" prompt, sidebar shows correct section.
4. **Clear localStorage mid-flow**: dashboard should still detect draft via `verify-access-code` → answers row check (`Dashboard.tsx:135-187`) and route to Continue, not Start.
5. **Open app on iPhone Safari**: tap chat input, keyboard opens — verify send button still visible and the gradient fade at `ChatInput.tsx:99` doesn't sit over content.
6. **Tab through Dashboard with keyboard only**: every interactive element reachable, focus ring visible, modals trap focus, Esc closes them.
7. **Throttle network to Slow 3G**: survey submission shows the "Submission Failed" alert with retry. Resume upload completes or shows a real error.
8. **Sign out → reload**: cookie consent banner does not re-appear if previously accepted. Sign-in works with the same email.
9. **Use a password manager** on `/auth` — autofill should populate fields (verify `autoComplete` attrs; appears missing on `EmailPasswordForm.tsx` inputs — add `autoComplete="email"`, `current-password`, `new-password`, `given-name`, `family-name`).
10. **Try uploading a 15MB PDF**: see the "File too large" toast.
11. **Try uploading a `.pages` Apple file**: see the file-type rejection.
12. **In chat, type "let's continue to the next section"** (instead of clicking the button) — verify the typed-text shortcut at `ChatContainer.tsx:467-486` routes correctly.
13. **Run axe DevTools** on Dashboard, Chat, Survey question 1, Survey final submit, Report. Fix all contrast and missing-label issues.
14. **Test browser back button** at every step (especially mid-survey, mid-chat). Mid-survey should keep state; mid-chat should not lose messages.
15. **Test with screen reader** (VoiceOver on Mac, NVDA on Windows): can you navigate the survey one question at a time? Are progress milestones announced (`aria-live`)? The `MilestoneBanner` in `SurveyForm.tsx:440-446` has no `aria-live="polite"` — add it.

Bottom line: the app is largely well-built with thoughtful UX (especially survey + processing + chat retry handling), but three things should hold launch: (1) decide and finish i18n, (2) fix the `dark` class hijack that's spreading hardcoded colors, (3) wire surfaced error states for the react-query hooks on Dashboard/Chat. Mobile chat input behavior on iOS is the biggest unknown — test on a real device before shipping.
