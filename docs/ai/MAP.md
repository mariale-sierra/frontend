# MAP — Where Things Live

## Purpose

A fast lookup index. See `../ARCHITECTURE-GUIDE.md` §4 ("Root Folder Map") for the fuller version — this is the quick-reference copy plus this doc tree.

## When to read

Whenever you need to find where something is implemented.

## Keep updated

- Whenever files, modules, routes, or folders are added, moved, renamed, or removed.

## Directory overview

| Path | What lives here |
| --- | --- |
| `app/` | Expo Router routes, route groups, layouts |
| `assets/` | Icons, splash, fonts, images |
| `components/` | Shared UI (`ui/`, `layout/`) + feature components (`challenge/`, `routine/`, `add/`, `home/`, `profile/`, ...) |
| `constants/` | Theme tokens (`theme/`), `challengeFilters.ts`, `muscleGroups.ts` |
| `context/` | `authContext.tsx`, `themeContext.tsx` |
| `docs/` | `ARCHITECTURE-GUIDE.md` (canonical), `POPUP_INTEGRATION_GUIDE.md`, `ai/` (this tree) |
| `hooks/` | Screen-orchestration hooks |
| `i18n/` | `react-i18next` setup, `resources/{en,es}.ts` |
| `services/` | `api.ts` (Axios client, baseURL from `app.config.js`'s `extra.apiUrl`), per-feature services, `adapters/`, `mocks/` (empty as of 2026-07-15 — its last dead files were deleted; recreate only for genuinely temporary mock data, don't let it become a live-screen fallback again) |
| `store/` | Zustand builder stores |
| `types/` | API/domain TypeScript contracts |
| `utils/` | `storage.ts`, `color.ts`, `time.ts`, `challengeCalendar.ts` |

## Feature → location

| Feature | Primary location(s) |
| --- | --- |
| Auth | `app/(auth)/`, `context/authContext.tsx`, `services/auth/` |
| Challenges | `app/(tabs)/challenges.tsx`, `app/challenge/`, `components/challenge/`, `services/challenge/`, `store/challengeBuilderStore.ts` |
| Routines | `app/challenge/routine/`, `components/routine/`, `services/routine/`, `store/routineBuilderStore.ts` |
| Metrics / workout logging | `app/(add)/`, `hooks/useMetricsScreen.ts`, `services/workout-log/`, `services/metrics/`, `store/metricsEntryStore.ts` |
| Uploads | `services/uploads/upload.service.ts`, `app/(add)/camera.tsx` |
| Profile | `app/(tabs)/profile.tsx`, `app/profile/[username].tsx`, `components/profile/` |
| Messaging (not built) | `app/messaging/`, `components/messaging/` (placeholder) |
| Notifications (not built) | `app/notifications.tsx`, `components/notifications/` (placeholder) |

## Entry points

- `expo-router/entry` (via `package.json`'s `main`) — real entry point; `App.tsx`/`index.ts` are legacy Expo starter files.
- `app/_layout.tsx` — root layout: `ThemeProvider`, `AuthProvider`, auth redirect, stack screens.
- `app/index.tsx` — redirects to `/(auth)/login` or `/(tabs)`.
- `services/api.ts` — the single Axios client.
- `app.config.js` — dynamic config layer over `app.json`; the only reason it exists is to expose `extra.apiUrl` (backed by the `EXPO_PUBLIC_API_URL` env var) for `services/api.ts`. Don't add unrelated config here without checking whether `app.json` already covers it.

> This map must reflect the real current codebase, not assumptions. If you used it and an entry was wrong or missing, fix it.
