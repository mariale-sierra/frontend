# TESTING-GUIDE

## Purpose

How to write and where to put tests for `frontend/`. There is currently **no test framework installed and no test script in `package.json`** — this guide is the standard to adopt, not a description of an existing suite. If asked to "run the tests" today, the honest answer is that there is no `test` script; don't invent one ad hoc without following this guide.

## When to read

Before installing a test framework or writing the first test. Before adding a hook/adapter/service that the plan says must ship with a test.

## Keep updated

- The moment `jest-expo`/`@testing-library/react-native` are actually installed and a `test` script exists in `package.json` — flip "Current state" below from "not installed" to real, with the actual script name.

## Current state

- `frontend/package.json` has **no test script and no test dependencies** (compare to `backend/package.json`, which already has Jest wired up). `npm test` does not currently do anything meaningful in this repo.
- No lint or typecheck script exists either (see root `CLAUDE.md`) — state that plainly if asked, same as for tests.
- Zero test files exist anywhere under `frontend/`.

## Framework (to install)

- **`jest-expo`** (Expo's Jest preset, handles the RN/Expo transform config) **+ `@testing-library/react-native`** (component rendering/queries) **+ `@testing-library/jest-native`** if extended matchers are wanted. These are the standard, minimal-footprint choice for an Expo Router app — no new state-management or mocking framework beyond what's needed to fake `services/api.ts` calls.
- Add a `test` script to `package.json` (`"test": "jest"`) and a `jest` config block (or `jest.config.js`) using the `jest-expo` preset, per Expo's own testing docs, once the packages are installed. Do this as its own change, not silently bundled into an unrelated feature PR.
- No new query/mocking library beyond the above — reuse the same Axios-mocking approach already implicit in how `services/<feature>/<feature>.service.ts` wraps `api` calls (mock the module, not `axios` globally, so each service test stays scoped).

## File location & naming

- **Preferred**: `__tests__/` folder per feature area (e.g. `hooks/__tests__/useChallengeProgress.test.ts`, `services/challenge/__tests__/challenge.service.test.ts`), mirroring where React Native/Expo projects conventionally put tests.
- **Also acceptable**: `*.test.tsx`/`*.test.ts` colocated directly next to the file under test, matching the backend's colocated `*.spec.ts` convention (`docs/ai/backend/TESTING-GUIDE.md`) if that reads better for a given feature. Pick one per feature folder and stay consistent within it — don't mix both patterns in the same folder.
- One test file per unit under test (one hook/service/adapter → one test file), not a catch-all `misc.test.ts`.

## Naming convention for test cases

`describe('<unit>')` blocks, `it('should <expected behavior>')` cases — same convention as the backend, so a reviewer reads both repos' test output the same way.

### Example names (target — the actual priority list to write first)

1. `should call the centralized api service instead of raw axios` (a lint-style test/grep-based check that a screen only imports from `services/`, not `axios`/`fetch` directly — see `docs/ai/CONVENTIONS.md`'s "don't create a second Axios client" rule)
2. `should attach the Authorization header when a token exists` (`services/api.ts` request interceptor)
3. `should map a 401 response to a session-cleared toast` (`services/api.ts` response interceptor)
4. `should map a network error to the offline toast, not a generic 500 toast`
5. `should clear cachedProgress on logout` (regression test for the `useChallengeProgress.ts` stale-cache bug described in the master plan §3.6)
6. `should normalize a raw challenge list response into the list view model` (`services/adapters/challengeListAdapter.ts`)
7. `should fall back to default locale (es) when a translation key is missing` (i18n)
8. `should map backend error code to a translated message` (once `ERROR-HANDLING.md`'s `code` field exists on the backend, see `frontend/docs/ai/frontend/I18N-GUIDE.md`)

## Priority list (write these first)

1. `services/api.ts` interceptors: request attaches token; response maps 401/403/404/500/network to the right toast via `store/errorNotificationStore.ts`.
2. `services/auth/token.service.ts`: set/get/clear token round-trips correctly.
3. `services/adapters/*`: at least one test per adapter verifying it normalizes a realistic backend payload into the expected view model shape.
4. `hooks/useChallengeProgress.ts`: the module-level `cachedProgress` bug — assert it does **not** leak a previous user's progress into a fresh session (login/logout invalidation).
5. i18n key parity between `en.ts` and `es.ts` (see `I18N-GUIDE.md` — this is as much a frontend test as an i18n concern).

## Minimum coverage guidance

Same philosophy as the backend: coverage is a proxy, not the goal.

- **Services/adapters** (pure logic, easiest to test in RN): ≥80% line coverage.
- **Hooks with real bugs on record** (`useChallengeProgress.ts`'s cache): a dedicated regression test, non-negotiable, regardless of overall coverage numbers.
- **UI components**: smoke test (renders without throwing) + explicit error/empty-state coverage for the handful of screens that already branch on `loading`/`error` (e.g. `app/(tabs)/challenges.tsx`, `app/(tabs)/profile.tsx`) — not exhaustive snapshot testing of every screen.
- Do not chase a global percentage; a test that mocks away the exact behavior it claims to verify is worse than no test.

## Mocking & test data

- Mock `services/api.ts`'s underlying Axios instance (or the specific `services/<feature>/<feature>.service.ts` module) rather than hitting the real backend (`http://20.63.84.1:3000`) from any test.
- Mock `AsyncStorage`/`expo-secure-store` (once the latter lands per `docs/ai/SECURITY.md`'s target model) rather than using real device storage.
- No real user data, no real tokens, no calls to the live Azure-backed API in any test.

## Related docs

- `backend/docs/ai/backend/TESTING-GUIDE.md` — the backend counterpart and shared naming convention.
- `frontend/docs/ai/frontend/I18N-GUIDE.md` — the key-parity test this guide references.
- `frontend/docs/ai/CURRENT-STATE.md` — known bugs (like the `cachedProgress` issue) that should get regression tests first.

> Must reflect the real current test setup, not an aspirational one. Update "Current state" the moment a test script or test file actually exists.
