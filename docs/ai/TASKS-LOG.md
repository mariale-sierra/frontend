# TASKS-LOG

## Purpose

A chronological log of completed work.

## When to read

When you need history on how the repo reached its current state, or to avoid repeating a task.

## Keep updated

- After completing any meaningful task, append an entry (newest at top).

## Log

### 2026-07-15 — Fase 2 (finish) + Fase 6 (i18n sweep) + Fase 3 (mock removal/refactor)
- **What:** consolidated the duplicate enrolled-challenges functions into one; applied the Fase 1 backend contract deltas (dropped `userId`/`createdByUserId` from request payloads); moved the API base URL to `app.config.js`/`EXPO_PUBLIC_API_URL`; moved the JWT to `expo-secure-store`; translated the `services/api.ts` interceptor's error toasts; swept ~35 hardcoded strings into `t()` across the plan's target file list plus `exerciseHeader.tsx`; fixed the systematic missing-Spanish-accents pattern across all of `es.ts`; removed mock fallbacks from `(tabs)/index.tsx`, `challenge/[id]/routine/[day].tsx`, and `ChallengeActiveProgressScreen.tsx` (replacing them with real empty/loading states, not blank screens); deleted 6 now-dead mock files; split `challenge/create.tsx` (773→538 lines) by extracting reference-data constants and reusable option-picker/info-modal components; unified challenge-create validation to a single source in `useCreateChallengeFlow`, removing two duplicate copies of the same rules.
- **Why:** master restructuring plan §9, Fases 2/3/6, Frontend Architecture agent scope.
- **Files:** see `CHANGES.md`'s 2026-07-15 entry for the full file-level breakdown (too long to repeat here).
- **Verification:** `npx tsc --noEmit` — only the 8 pre-existing errors (unrelated: `active-all.tsx` view-model typing, `errorNotification.tsx` `TextTone`, `useMetricsScreen.ts` strict-null checks) remain, none introduced by this work. Grep confirms zero `import api`/`from 'axios'`/`fetch(` outside `services/` (the one exception, `services/uploads/upload.service.ts`'s raw `fetch` PUT to a pre-signed URL, is unchanged and already documented). en/es key parity verified via a one-off compiled-JS check (262 keys each, zero drift).
- **Not done / explicitly out of scope this pass:** did not split `renderStepContent()`'s per-step JSX in `create.tsx` into separate step components (would need ~15 props threaded per step for uncertain benefit); did not fix the pre-existing 8 tsc errors (unrelated to this task); did not do a repo-wide `console.log` purge (only removed the ones in code directly rewritten here); did not fix the `¿`/`¡` missing-inverted-punctuation pattern in `es.ts` (only fixed missing accent marks, per the plan's literal examples).

### 2026-07-07 — Adapted the `app-builder`/`app-builder-frontend` skills and bootstrapped `docs/ai/`
- **What:** rewrote both skills' `SKILL.md` + `templates/` for Havit's real stack; created this `docs/ai/` tree (`INDEX`, `ARCHITECTURE`, `CURRENT-STATE`, `MAP`, `CHANGES`, `CONVENTIONS`, `DECISIONS`, `TASKS-LOG`, `ROADMAP`, plus `frontend/` subfolder docs) pointing to the pre-existing `../ARCHITECTURE-GUIDE.md` rather than duplicating it.
- **Why:** the skills were copied from another project (Klyro) with a different stack and would have misled future sessions if left as-is.
- **Files:** `.claude/skills/app-builder*/**` (shared with `backend/`), `frontend/docs/ai/**`.

> This log must reflect work actually completed, not assumptions.
