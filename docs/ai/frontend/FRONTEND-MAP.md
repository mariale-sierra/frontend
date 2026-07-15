# FRONTEND-MAP

## Purpose

Locate frontend code fast. See `../../ARCHITECTURE-GUIDE.md` §4, §6, §12 for the fuller breakdown (root folder map, bottom nav, challenge module map) — this is the quick-reference version. Also see `../MAP.md` for the repo-wide version of this table.

## When to read

Whenever you need to find where a frontend thing lives.

## Keep updated

- Whenever files, routes, or modules are added/moved/removed.

## Route groups → purpose

| Group | Purpose | Layout |
| --- | --- | --- |
| `(auth)` | Login, register, recover password, onboarding | `app/(auth)/_layout.tsx` |
| `(tabs)` | Bottom-tab screens: home, search, add, challenges, profile | `app/(tabs)/_layout.tsx` |
| `(add)` | Full-screen modal add-progress flow: metrics, camera, preview, rest-day | `app/(add)/_layout.tsx` |

Non-grouped stacks: `app/challenge/`, `app/home/`, `app/messaging/`, `app/profile/`.

## Routes → file (non-exhaustive; see `../../ARCHITECTURE-GUIDE.md` §12 for the full challenge route table)

| Route | File |
| --- | --- |
| `/` | `app/index.tsx` |
| `/(tabs)` | `app/(tabs)/_layout.tsx` |
| `/challenge/[id]` | `app/challenge/[id]/index.tsx` |
| `/challenge/[id]/progress` | `app/challenge/[id]/progress.tsx` → `components/challenge/progress/ChallengeActiveProgressScreen.tsx` (presentational; data via `hooks/useChallengeActiveProgress.ts`) |
| `/challenge/create` | `app/challenge/create.tsx` |
| `/notifications` | `app/notifications.tsx` (modal) |

## `app/challenge/create.tsx` support files (split out 2026-07-15)

- `constants/challengeCreateOptions.ts` — `CATEGORY_OPTIONS`/`LOCATION_OPTIONS`/`VISIBILITY_OPTIONS` reference data (still `MOCK ONLY`, pending a backend reference-data endpoint).
- `components/challenge/create/OptionSelectionPanel.tsx` — generic multi-select option-card grid (categories/locations step).
- `components/challenge/create/OptionInfoModal.tsx` — detail dialog for an option card's info affordance.
- `hooks/useCreateChallengeFlow.ts` — the single source of truth for challenge-create validation (`getStepErrors`/`missingConfigurationFields`; `isFormComplete` derives from the latter, doesn't restate the rules). `services/adapters/createChallengePayloadAdapter.ts`'s `buildCreateChallengePayload` is a pure payload transform, not a second validation layer — don't add field-presence checks back into it.

> Must reflect the real current frontend, not assumptions.
