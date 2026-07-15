# CURRENT-STATE

## Purpose

A snapshot of what is actually built, in progress, or broken **right now**. Prevents re-doing finished work or assuming something exists that doesn't. See `../ARCHITECTURE-GUIDE.md` §12 ("Challenge Module Map" → "Mock data and gaps") for more detail on the challenge area specifically.

## When to read

At the start of any task, right after ARCHITECTURE.

## Keep updated

- Whenever a feature's status changes (new → in progress → done → broken).
- Whenever something is discovered to be broken or incomplete.

## Status legend

- ✅ Done / stable
- 🚧 In progress
- 🧪 Experimental / partial
- ❌ Broken / known issue
- 📐 Planned (see ROADMAP)

## Feature status

| Feature / area | Status | Notes |
| --- | --- | --- |
| Auth — login/register | ✅ | `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `context/authContext.tsx`, `services/auth/`. Real forms wired to `useAuth()`/the backend. |
| Auth — recover password | 🧪 stub | `app/(auth)/recover-password.tsx` is a one-line placeholder (`<Text>Recover Password Screen</Text>`), no form, no service call. |
| Auth — onboarding (objectives/preferences/profile type) | 🧪 stub | `app/(auth)/onboarding/objectives.tsx`, `preferences.tsx`, `profile_type.tsx` are each a one-line placeholder (`<Text>... Screen</Text>`), no logic. |
| Bottom tabs (home/search/add/challenges/profile) | ✅ | `app/(tabs)/`. |
| Challenge discovery/detail/create | ✅ (mocks removed) | `app/(tabs)/challenges.tsx` fetches real data (`getMyChallenges()` + `getChallenges()`, via `services/user/user.service.ts` / `services/challenge/challenge.service.ts`). As of 2026-07-15, `services/mocks/exploreMock.ts`/`activeMock.ts`/`homeMock.ts`/`feedMock.ts`/`challengeDetailMock.ts`/`publicChallengePhotos.ts` no longer exist (deleted — were dead or made dead by removing their fallback callers); `app/challenge/[id]/routine/[day].tsx`'s `ENABLE_CHALLENGE_DETAIL_MOCK` fallback is gone (real empty state instead); `components/challenge/progress/ChallengeActiveProgressScreen.tsx`'s `mockChallenge` is gone (presentational component + `hooks/useChallengeActiveProgress.ts`). Remaining, explicitly-labeled mock/reference data (not removed — see note below): `constants/challengeCreateOptions.ts` (`CATEGORY_OPTIONS`/`LOCATION_OPTIONS`/`VISIBILITY_OPTIONS`, extracted from `app/challenge/create.tsx` but still `MOCK ONLY` pending backend reference-data endpoints); `constants/challengeFilters.ts` (`CATEGORY_TO_ACTIVITY`); `store/routineBuilderStore.ts`'s seed/mock routine data. |
| Routine builder / exercise picker | ✅ | `app/challenge/routine/`, `components/routine/`. |
| Metrics entry / workout logging | ✅ | `app/(add)/`, `hooks/useMetricsScreen.ts`, `store/metricsEntryStore.ts`. |
| Uploads (camera/preview) | ✅ | `app/(add)/camera.tsx`, `services/uploads/upload.service.ts`. |
| Profile — own profile (tab) | ✅ | `app/(tabs)/profile.tsx` fetches real data via `getMe()` (`services/user/user.service.ts`), has loading/error states, uses `components/profile/` (`ProfileHeader`, `PostsViewToggle`, `PostsGrid`, `ProfilePhotoModal`). |
| Profile — public profile by username | 🧪 stub | `app/profile/[username].tsx` is a one-line placeholder (`<Text>User Profile</Text>` + the raw `username` param), no fetch, no real layout. |
| Messaging | 📐 not built | `app/messaging/` routes exist and render, but `components/messaging/` is just `.gitkeep` + an empty barrel `index.ts`. Matches the backend: no `spaces`/`direct_conversations`/`direct_messages` module exists yet either. |
| Notifications | 📐 not built | `app/notifications.tsx` exists as a modal route, but `components/notifications/` is just `.gitkeep` + empty barrel. Matches the backend: no `notifications` module yet. |
| Social feed / likes | 📐 not built | `components/social/` is `.gitkeep` + empty barrel. Backend has no `user_follows`/`workout_post_likes` module yet either. |
| Skeleton loading states | 🧪 | `react-native-shimmer-placeholder` and `@shopify/react-native-skia` are installed but no project-wide skeleton component/convention exists — current pattern is `ActivityIndicator`/`Loader`. |

## Known issues & debt

- ~~Base URL for the API is hardcoded in `services/api.ts`~~ — fixed 2026-07-15: now read from `app.config.js`'s `extra.apiUrl` (`EXPO_PUBLIC_API_URL` env override), default unchanged (`http://20.63.84.1:3000`, still plain HTTP — the backend has no TLS certificate yet, this is a pending infra dependency not a frontend gap).
- Mock/reference data still present, explicitly labeled, not removed (see the Challenge discovery/detail/create row above for the current inventory) — don't silently extend a mock path; flag it when a task touches one.
- Backend gap surfaced 2026-07-15 by removing `ChallengeActiveProgressScreen`'s mock fallback: `GET /challenges/progress` has no participant roster and no per-day workout-completion array, so the active-progress screen's participant avatars/calendar "completed" dots are currently always empty (honest empty state, not fake data) until the backend adds those fields. See `hooks/useChallengeActiveProgress.ts`'s doc comment.
- JWT moved to `expo-secure-store` on 2026-07-15 (was AsyncStorage). Existing logged-in users are logged out once after upgrading past this change — SecureStore and AsyncStorage are different backing stores, so a token written to one isn't visible to the other. Expected, not a regression.
- No lint/typecheck/test npm script is configured for this repo (`package.json` has none) — say so plainly rather than inventing one.

> This document must reflect the real current codebase, not assumptions.
