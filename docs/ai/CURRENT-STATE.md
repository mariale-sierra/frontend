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
| Auth (login/register/recover/onboarding) | ✅ | `app/(auth)/`, `context/authContext.tsx`, `services/auth/`. |
| Bottom tabs (home/search/add/challenges/profile) | ✅ | `app/(tabs)/`. |
| Challenge discovery/detail/create | 🧪 | Real API mixed with mock data: `app/(tabs)/challenges.tsx` uses `buildMockExploreChallenges()`/`buildMockRestDayChallenges()` (`REMOVE_MOCK` comments); `app/challenge/[id]/routine/[day].tsx` has an `ENABLE_CHALLENGE_DETAIL_MOCK` fallback; `app/challenge/create.tsx` has local mock category/location lists meant to come from backend/reference data; `store/routineBuilderStore.ts` has seed/mock routine data. |
| Routine builder / exercise picker | ✅ | `app/challenge/routine/`, `components/routine/`. |
| Metrics entry / workout logging | ✅ | `app/(add)/`, `hooks/useMetricsScreen.ts`, `store/metricsEntryStore.ts`. |
| Uploads (camera/preview) | ✅ | `app/(add)/camera.tsx`, `services/uploads/upload.service.ts`. |
| Profile | ✅ | `app/(tabs)/profile.tsx`, `app/profile/[username].tsx`, `components/profile/`. |
| Messaging | 📐 not built | `app/messaging/` routes exist and render, but `components/messaging/` is just `.gitkeep` + an empty barrel `index.ts`. Matches the backend: no `spaces`/`direct_conversations`/`direct_messages` module exists yet either. |
| Notifications | 📐 not built | `app/notifications.tsx` exists as a modal route, but `components/notifications/` is just `.gitkeep` + empty barrel. Matches the backend: no `notifications` module yet. |
| Social feed / likes | 📐 not built | `components/social/` is `.gitkeep` + empty barrel. Backend has no `user_follows`/`workout_post_likes` module yet either. |
| Skeleton loading states | 🧪 | `react-native-shimmer-placeholder` and `@shopify/react-native-skia` are installed but no project-wide skeleton component/convention exists — current pattern is `ActivityIndicator`/`Loader`. |

## Known issues & debt

- Base URL for the API is hardcoded in `services/api.ts` (`http://20.63.84.1:3000`), not env-driven.
- Mock data is mixed into otherwise-real screens in the challenge area (see table above) — don't silently extend a mock path; flag it when a task touches one.
- No lint/typecheck/test npm script is configured for this repo (`package.json` has none) — say so plainly rather than inventing one.

> This document must reflect the real current codebase, not assumptions.
