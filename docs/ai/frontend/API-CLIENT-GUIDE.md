# API-CLIENT-GUIDE

## Purpose

How the frontend talks to the backend. See `../../ARCHITECTURE-GUIDE.md` §7 ("API and Backend Integration") for the fuller version and `backend/docs/ai/backend/BACKEND-INTEGRATION-GUIDE.md` for the contract from the backend's side.

## When to read

Before adding or changing any backend call.

## Keep updated

- When endpoints, payloads, response shapes, or services change.
- Must stay in sync with `backend/docs/ai/backend/BACKEND-INTEGRATION-GUIDE.md` / Swagger.

## Client setup

`services/api.ts` — single Axios instance, `baseURL` currently hardcoded to `http://20.63.84.1:3000`. Request interceptor attaches `Authorization: Bearer <token>` via `services/auth/token.service.ts` (token hydrated from `utils/storage.ts`/AsyncStorage). Response interceptor maps HTTP status (401/403/404/500) and network errors to `store/errorNotificationStore.ts` toasts. **Do not create a second Axios client.**

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
| `services/workout-log/workout-log.service.ts` | `/workout-logs/*` |
| `services/metrics/metrics.service.ts` | `/metrics/*` |
| `services/uploads/upload.service.ts` | `/uploads/sign`, then a direct `fetch` PUT to the signed URL (bypasses the shared Axios client on purpose — its baseURL/auth headers would break a pre-signed upload) |

`services/mocks/` holds temporary mock data for the still-mocked parts of the challenge area (see `../CURRENT-STATE.md`) — not real endpoint usage.

## Auth

Token stored/hydrated via `services/auth/token.service.ts` + `utils/storage.ts`; session restore/validation happens in `context/authContext.tsx` (`GET /auth/me`; a 401 clears the session, other errors preserve it). No multi-tenant context to attach to requests.

## Error handling

Owned centrally by `services/api.ts`'s response interceptor → toast. Screen-level code only needs its own loading/empty/error UI state, not a re-implementation of the global error mapping.

> Must reflect the real current API usage AND match the backend contracts, not assumptions.
