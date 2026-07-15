# API-CLIENT-GUIDE

## Purpose

How the frontend talks to the backend. See `../../ARCHITECTURE-GUIDE.md` §7 ("API and Backend Integration") for the fuller version and `backend/docs/ai/backend/BACKEND-INTEGRATION-GUIDE.md` for the contract from the backend's side.

## When to read

Before adding or changing any backend call.

## Keep updated

- When endpoints, payloads, response shapes, or services change.
- Must stay in sync with `backend/docs/ai/backend/BACKEND-INTEGRATION-GUIDE.md` / Swagger.

## Client setup

`services/api.ts` — single Axios instance. `baseURL` comes from `app.config.js`'s `extra.apiUrl` (read via `expo-constants`), which itself resolves `process.env.EXPO_PUBLIC_API_URL` with a fallback to `http://20.63.84.1:3000` if unset. Still plain HTTP by default — the backend has no TLS certificate yet, so `app.config.js` deliberately does not force HTTPS; that's a pending infra dependency, not something to "fix" by hardcoding `https://` (it would just break every request). Request interceptor attaches `Authorization: Bearer <token>` via `services/auth/token.service.ts` (token hydrated from `utils/storage.ts`'s `secureStorage`, backed by `expo-secure-store` — **not** AsyncStorage since 2026-07-15; userId/username still use AsyncStorage via `storage`). Response interceptor maps HTTP status (401/403/404/500) and network errors to `store/errorNotificationStore.ts` toasts, with messages sourced from `i18n.t('common.errors.*')` (translated as of 2026-07-15 — previously hardcoded Spanish). **Do not create a second Axios client.**

## Data fetching

No query-cache library. `services/<feature>/<feature>.service.ts` calls `api` and returns `response.data`; hooks/screens call the service directly and hold loading/error state locally (`hooks/useMetricsScreen.ts`, `hooks/useCreateChallengeFlow.ts`, `hooks/usePublicChallengePhotos.ts`). `services/adapters/` normalize backend response shapes into UI view models when they differ (`challengeListAdapter.ts`, `challengeDetailAdapter.ts`, `createChallengePayloadAdapter.ts`, `feedAdapter.ts`, `homeAdapter.ts`, `metricsAdapter.ts`).

## Endpoint map (frontend usage)

| Frontend service | Backend area |
| --- | --- |
| `services/auth/auth.service.ts` | `/auth/*` |
| `services/user/user.service.ts` | `/users/*` |
| `services/challenge/challenge.service.ts` | `/challenges/*` |
| `services/exercises/exercises.service.ts` | `/exercises/*` |
| `services/routine/routine.service.ts` | `/routine/*` |
| `services/workout-log/workout-log.service.ts` | `/workout-logs/*` — `createWorkoutLog` no longer sends `userId` (backend derives it from the JWT; see `types/workout-log.ts`) |
| `services/metrics/metrics.service.ts` | `/metrics/*` |
| `services/routine/routine.service.ts` | `/routine/*` — `createRoutine` no longer sends `createdByUserId` (backend derives it from the JWT; see `types/routine.ts`) |
| `services/uploads/upload.service.ts` | `/uploads/sign`, then a direct `fetch` PUT to the signed URL (bypasses the shared Axios client on purpose — its baseURL/auth headers would break a pre-signed upload) |

`services/mocks/` is empty as of 2026-07-15 (its last dead files were deleted alongside the mock fallbacks that used them) — not real endpoint usage; recreate only for genuinely temporary data, and don't wire it as a live-screen fallback.

`services/user/user.service.ts`'s `getMyChallenges()` (`GET /users/me/challenges`) is the **single** source for the current user's enrolled challenges — it flattens the backend's `{active, completed, left}` grouped response into one array (each item keeps its own `status`). Don't add a second function hitting this endpoint; a near-identical one in `services/challenge/challenge.service.ts` was removed 2026-07-15 for exactly this reason.

## Auth

Token stored/hydrated via `services/auth/token.service.ts` + `utils/storage.ts`'s `secureStorage` (`expo-secure-store`, since 2026-07-15 — was AsyncStorage); session restore/validation happens in `context/authContext.tsx` (`GET /auth/me`; a 401 clears the session, other errors preserve it). No multi-tenant context to attach to requests.

## Error handling

Owned centrally by `services/api.ts`'s response interceptor → toast. Screen-level code only needs its own loading/empty/error UI state, not a re-implementation of the global error mapping.

> Must reflect the real current API usage AND match the backend contracts, not assumptions.
