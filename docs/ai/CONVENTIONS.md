# CONVENTIONS

## Purpose

The coding conventions for `frontend/`. See `../ARCHITECTURE-GUIDE.md` §13 ("Do and Don't Rules") for the fuller list — this file is the quick reference.

## When to read

Before writing or editing code here.

## Keep updated

- When a convention is adopted, changed, or retired (update `../ARCHITECTURE-GUIDE.md` too).

## Naming

- Route files follow Expo Router conventions: `(group)` for route groups, `[param]` for dynamic segments, `_layout.tsx` for layouts, `+not-found.tsx` for the 404 route.
- Components: PascalCase filenames for components (`ActiveChallengeSection.tsx`), camelCase for hooks/utils/services (`useAuth.ts`, `challenge.service.ts`).
- Services: `services/<feature>/<feature>.service.ts`, calling the shared `api` and returning `response.data`.

## Structure & organization

- New tab-level screens → `app/(tabs)/`; add-flow screens → `app/(add)/`; challenge screens → `app/challenge/`; feature UI → `components/<feature>/`.
- Shared/reusable UI → `components/ui/`; layout primitives → `components/layout/`.
- Multi-step flow state → a Zustand store in `store/`, not component state threaded through props.

## Style & formatting

- TypeScript `strict: true`. No configured lint/format script — match the surrounding file's style (local `StyleSheet.create`, theme tokens from `constants/theme/`).

## Error handling & logging

- API errors are handled centrally by `services/api.ts`'s Axios response interceptor → `store/errorNotificationStore.ts` toasts. Don't re-implement error-to-toast mapping per screen; let it flow through.

## Testing

- No test setup exists in this repo (`package.json` has no test script). State that plainly if asked to run tests rather than inventing a command.

## Anti-patterns to avoid

- Don't create a second Axios client — reuse `services/api.ts`.
- Don't introduce react-hook-form/zod/TanStack Query/shadcn — none exist here.
- Don't hardcode a user-visible string — add it to `i18n/resources/en.ts` **and** `es.ts`.
- Don't silently extend the known mock-data spots (see `CURRENT-STATE.md`) — flag them.

> These conventions must reflect how the real codebase is actually written, not assumptions.
