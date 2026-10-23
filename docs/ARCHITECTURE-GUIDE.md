# Havit Architecture Guide

## 1. Project Overview
Havit is a React Native mobile app built with Expo and Expo Router. The frontend is organized around file-based routes in `app/`, shared and feature components in `components/`, backend access in `services/`, reusable hooks in `hooks/`, global providers in `context/`, Zustand stores in `store/`, typed contracts in `types/`, and theme constants in `constants/`.

The app currently includes authentication, bottom tabs, challenge discovery/detail/create flows, routine creation, workout metrics logging, uploads, profile, messaging, notifications, and onboarding routes.

## 2. Tech Stack
- Expo SDK `57`
- React `19.2.3`
- React Native `0.86.3`
- Expo Router `~57.0.19`
- TypeScript `~5.9.2` with `strict: true`
- Axios for API requests
- `@react-native-async-storage/async-storage` for persisted auth/session values
- Zustand for local feature state
- `react-i18next` and `i18next` for translations
- `@expo/vector-icons` / Ionicons for icons
- Expo Camera, Image Picker, Linear Gradient, Localization, Linking, StatusBar
- React Native Safe Area Context, Screens, Reanimated, Web
- `react-native-shimmer-placeholder` and `@shopify/react-native-skia` are installed, but no project-wide skeleton convention was found

## 3. Available Commands
Scripts found in `package.json`:

- Install: no package script exists. README recommends `npm install --legacy-peer-deps`.
- Start: `npm run start` runs `expo start`.
- Android: `npm run android` runs `expo start --android`.
- iOS: `npm run ios` runs `expo start --ios`.
- Web: `npm run web` runs `expo start --web`.
- Web Skia setup: the custom `index.web.tsx` entry waits for CanvasKit/WASM via `LoadSkiaWeb()` before registering Expo Router; `postinstall` refreshes `public/canvaskit.wasm` after Skia upgrades. App canvases go through `components/ui/webSafeCanvas.tsx` on web so each draw waits for a non-zero layout, releases its WebGL context, and route-owned background canvases unmount while their screen is covered. Card-only `AccentGlow` decorations use the flat card surface on web because CanvasKit can receive a stale zero-sized layout while cards mount or resize; native keeps Skia's regular renderer. This prevents CanvasKit's `rangeMin` or zero-sized `drawImage` errors without removing card interaction or content.
- Lint: no script exists.
- Typecheck: `npm run typecheck` (`tsc --noEmit`).
- Test: `npm test` (Jest). Coverage: `npm run test:coverage`; `collectCoverageFrom` covers `services`, `hooks`, `i18n`, `components` and `app` (minus `__tests__`, `.d.ts` and the re-export-only `components/**/index.ts`).
- i18n parity: `npm run i18n:check`. Code metrics (screen lines, `console.*`, `any` as a type): `npm run metrics` — both used by `docs/sprint-10/`.

## 4. Root Folder Map
- `app/`: Expo Router file-based routes, route groups, layouts, tabs, modals, dynamic challenge routes, auth screens, and add/metrics flows.
- `assets/`: app icons, splash assets, fonts, icons, and images.
- `components/`: shared UI/layout components and feature-specific components grouped by domain (`challenge`, `routine`, `add`, `home`, `profile`, etc.).
- `constants/`: theme tokens and feature constants such as challenge filters and muscle groups.
- `context/`: React context providers for auth and theme.
- `hooks/`: custom hooks that coordinate UI state, services, stores, routing, and translations.
- `i18n/`: translation setup and language resources.
- `services/`: API client, feature services, adapters, uploads, auth/token handling, and temporary mocks.
- `store/`: Zustand stores for challenge builder, routine builder, and metrics entry flows.
- `types/`: TypeScript API/domain contracts.
- `utils/`: small utilities for storage, color, and time.

No `lib/` folder currently exists.

## 5. Routing Architecture
Routing is Expo Router-based. The app entry in `package.json` is `expo-router/entry`; `App.tsx` and `index.ts` still exist as legacy starter files but routing is driven by `app/`.

- Root layout: `app/_layout.tsx` wraps the app in `ThemeProvider` and `AuthProvider`, restores auth, redirects unauthenticated users to `/(auth)/login`, and registers only its direct stack children. Nested challenge routes are registered by their own layouts, so they must not be declared again from the root stack.
- Root index: `app/index.tsx` redirects to `/(auth)/login` or `/(tabs)` based on auth state.
- Auth group: `app/(auth)/` contains login, register, recover password, and onboarding routes.
- Tabs group: `app/(tabs)/` contains `index`, `search`, `add`, `challenges`, and `profile`.
- Add group: `app/(add)/` is presented as a full-screen modal and contains metrics, camera, preview, rest-day, and plan-rest-days screens.
- Challenge stack: `app/challenge/` contains challenge list extensions, create flow, dynamic detail routes, and routine setup routes.
- Dynamic routes: `app/challenge/[id]/index.tsx`, `app/challenge/[id]/info.tsx`, and `app/challenge/[id]/routine/[day].tsx`.
- Modal route: `app/notifications.tsx` is registered with `presentation: 'modal'`.

New screens should first be matched to an existing route group. Put tab-level screens in `app/(tabs)/`, add-flow screens in `app/(add)/`, challenge screens in `app/challenge/`, and feature UI in the matching `components/<feature>/` folder.

## 6. Bottom Navigation
Bottom tabs are defined in `app/(tabs)/_layout.tsx` using `Tabs` from Expo Router.

There are four routable tabs inside one capsule: `index` (Home), `search`, `challenges`, and `profile`. The `add` route remains registered only because Expo Router needs a file for it; its responsive fifth slot renders the separate right-hand `+` action, prevents `tabPress`, and opens `/log` directly. The glass background only covers the first four slots, leaving the action visually floating beside it. `BOTTOM_NAV_VARIANT` in `constants/bottomNav.ts` selects the new `glass` presentation by default. The original `BottomNavBackground` and its absolute geometry remain intact as the `legacy` fallback; switching that constant back to `legacy` also restores the matching legacy item geometry.

The `(tabs)` stack screen keeps the navigator's area behind the transparent bar on Havit's `ink` surface, and the root navigation theme makes its card/background `ink` with a transparent border. Every platform uses an absolute transparent `tabBarStyle`, so scenes continue behind the floating bar instead of ending at a reserved strip. The bar itself remains implemented through `tabBarBackground` and per-item buttons; this preserves the custom visual and gesture layers while the native touch behavior is re-checked after any tab-bar style change.

The navbar implementation is deliberately split across:
- `components/navigation/bottomNavBackground.tsx`: decorative capsule, blur, and one shared indicator.
- `components/navigation/bottomNavGlassBackground.tsx`: active cross-platform four-tab glass capsule.
- `components/navigation/bottomNavGlassSurface.tsx` / `.ios.tsx`: shared Android/Web blur material and optional Expo native Liquid Glass on iOS 26+, used by the capsule and by the `+` action with a light `paper` tint.
- `components/navigation/bottomNavIndicator.tsx`: the single oval that translates between tab slots.
- `components/navigation/bottomNavTabButton.tsx`: explicit `Tap` and `Pan` gestures for tab selection and horizontal dragging.
- `components/navigation/bottomNavContext.tsx`: shared visual state and the UI-thread spring/stretch sequence.
- `constants/bottomNav.ts`: geometry, icon/label/FAB presentation settings, and motion settings used by both the drawing and interactive layers.

`activeIndex` is a Reanimated `SharedValue` representing only the visual position (continuous from 0 through 3), not React Navigation's discrete route state. The selector, outline/filled icon wrapper opacity, and label color all derive directly from that same shared value on the UI thread, with no React-state or intermediate-derived visual state. Each Ionicon itself remains static inside an `Animated.View`, avoiding delayed animated-style reconciliation through the vector icon's nested native `Text` under Fabric. A drag writes this value on the UI thread, bounds it to the first/last tab, then rounds and springs to the nearest slot on release before a single JS bridge requests navigation. A tap starts that same spring before navigation. Route selection is only a fallback synchronizer for external navigation; a matching route update from the gesture is ignored so it cannot reset or restart an in-flight animation. Tab option render props are memoized and inactive screens use `freezeOnBlur` so opening a screen does not also reconcile inactive tab content. `BOTTOM_NAV_HEIGHT` is the single shared outer-height source: the capsule uses it directly and the FAB derives both width and height from it, with half-height radii so the pair remains aligned as a capsule and a true circle. Its labels use a local compact treatment so their visual weight remains balanced in the taller capsule. `BOTTOM_NAV_INDICATOR_EXTRA_WIDTH` widens the selector while recalculating the four tab slots and their outer insets from the same geometry: icons and selector centers remain aligned, including Home and Profile. It never changes route state or spring behavior.

Avoid a fully custom `tabBar`: on iOS with Fabric enabled, it has historically made the whole bar unresponsive. The current `tabBarStyle` is intentionally limited to the transparent absolute overlay needed for the floating layout; preserve the existing `tabBarBackground` plus custom `tabBarButton` extension points. To change tab metadata, icons, ordering, or behavior, edit `app/(tabs)/_layout.tsx`; keep geometry and indicator motion synchronized through `constants/bottomNav.ts` rather than duplicating values.

## 7. API and Backend Integration
- API client: `services/api.ts`.
- Base URL: `extra.apiUrl`, resolved in `app.config.js` from `EXPO_PUBLIC_API_URL`. Development builds may use plain HTTP (LAN backend via `npm run start:local`; the `http://20.63.84.1:3000` fallback is dev-only). `preview`/`production` builds (B3, sprint 10) must use an `https://` URL — resolving the config fails otherwise — and ship with `usesCleartextTraffic=false`. See `docs/sprint-10/B3-https-transporte.md`.
- Token injection: `services/api.ts` has an Axios request interceptor that calls `getAccessToken()` and sets `Authorization: Bearer <token>`.
- Timezone header: native clients send `X-Timezone`; web omits it so browser requests remain compatible with older API deployments whose CORS allow-list does not include that custom header. The backend falls back to UTC when it is absent.
- Timeout: every request has a 30s `timeout`, so a dead connection fails (with the timeout toast) instead of leaving a spinner forever.
- Error toasts: the response interceptor shows one translated toast per failed request via `showApiErrorToast()` (exported from `services/api.ts`). Messages are always i18n: a few user-actionable backend messages are mapped to `common.errors.known.*` (`utils/apiError.ts`'s `KNOWN_BACKEND_MESSAGES` — the API answers in English); anything else gets the message for its status (400/422, 403, 404, 409, 429, 5xx, timeout, network). Raw server text (class-validator arrays, internal names) never reaches the UI. A 401 on a request that carried a token signs the user out (`notifySessionExpired`); a 401 without one (sign-in, a password re-check) shows "credentials not correct".
- `suppressErrorToast: true` opts a request out of that toast when the screen shows its own message (login/register do, so a wrong password is one toast, not two).
- In a screen: an API failure already has its toast — use `wasErrorToastShown(error)` (`utils/apiError.ts`) before adding an `Alert`, and `getApiErrorMessage(error, t, fallback)` for an inline message next to the button/field that failed. Never show `error.response.data.message` directly.
- Logging: `logError(scope, error)` / `logWarn(scope, message)` (`utils/apiError.ts`) print only in `__DEV__` and only method + path (no query) + status/code — never response bodies, headers (the bearer token travels there), payloads or signed upload URLs. Don't `console.*` an Axios error object.
- Token storage: `services/auth/token.service.ts` keeps the access token in memory and hydrates it from `utils/storage.ts`.
- AsyncStorage wrapper: `utils/storage.ts` wraps `AsyncStorage.getItem`, `setItem`, and `removeItem`.
- Auth service: `services/auth/auth.service.ts` calls `/auth/login`, `/auth/register`, stores token, `userId`, and `username`, and clears them on logout.
- Auth context: `context/authContext.tsx` restores session using stored values and validates `/auth/me`; 401 clears session, non-401 errors preserve the stored session.
- Service convention: services live under `services/<feature>/<feature>.service.ts`, import the shared `api`, return `response.data`, and use typed contracts from `types/`.
- Adapters: `services/adapters/` normalize backend contracts into UI view models and payloads.
- Routine library: `services/routine/routine.service.ts` loads the authenticated user's persisted routines from `GET /routine`; `services/adapters/routineAdapter.ts` maps the backend's `routine_exercises`/metrics relations into `RoutineSummary` before the challenge routine picker displays them.
- Upload convention: `services/uploads/upload.service.ts` signs via the API, then uses native `fetch` for the signed URL PUT because Axios baseURL/auth headers would break pre-signed uploads.

Future services should reuse `services/api.ts`, avoid creating another Axios client, preserve token logic, add typed request/response contracts under `types/`, and normalize backend shapes through adapters when UI view models differ from API contracts.

## 8. State, Hooks, and Contexts
- `context/authContext.tsx`: global auth/session state and login/register/logout actions.
- `context/themeContext.tsx`: exposes theme tokens from `constants/theme`.
- `hooks/useAuth.ts` and `hooks/useTheme.ts`: thin wrappers around their contexts.
- **Shared server-data cache** (`services/cache/`, `hooks/useCachedQuery.ts`) — see §8b.
- `hooks/useCreateChallengeFlow.ts`: orchestrates challenge creation state, validation, payload building, backend submit, and navigation.
- `hooks/useMetricsScreen.ts`: coordinates enrolled challenges, today's routine, workout log creation, metric submit, loading/error state, and navigation.
- `hooks/usePhotoProgressSubmit.ts`: the camera's confirm flow (upload → `POST /workout-logs/progress` with the B7 location choice and B8 tags → metrics → cache invalidation → close the `(add)` modal → logged-day popup with the photo's real review state). Holds the B5 double-tap guard; `app/(add)/camera.tsx` only owns the camera and the form.
- `hooks/useFilteredExercises.ts`: filters exercise candidates for routine exercise selection.
- `hooks/usePullToRefresh.ts`: generic `{ refreshing, onRefresh }` pair for a `RefreshControl` — wraps a screen's own reload function with the refreshing-flag toggle so each screen doesn't hand-roll it. Used by Home, Challenges, Profile (own/other), and Messaging; a component that fetches its own data internally (e.g. `PostsGrid`, `UserPostsGrid`) instead takes a `refreshSignal` prop the parent screen bumps on refresh.
- Zustand stores in `store/`: hold multi-screen local builder state for challenges, routines, and metrics. Routine day assignments remain transient per challenge, while the routine picker hydrates its reusable routine list from the backend.

Prefer hooks for screens that coordinate services, stores, translations, routing, alerts, loading, and errors. Direct service calls are acceptable in small screens, but shared or multi-step behavior should move into a hook or store following existing patterns.

## 8b. Server-data cache (stale-while-revalidate, no extra dependency)
Data that several screens read, or that is read again on every visit, goes through one in-memory cache keyed by name (`services/cache/queryCache.ts`), optionally mirrored to AsyncStorage per user so a cold start paints the last known data at once.
- Keys and freshness live in `services/cache/queries.ts` (`queryKeys`, `staleTimes`): `me:challenges` (GET /users/me/challenges — Home, Challenges › Mine, Search, Log picker, membership checks), `me:photos` (GET /workout-posts/mine), `me:profile`, `challenges:all` (every page of GET /challenges — Explore, Search), `feed` (the pages loaded so far), `follow:streaks`, `badges:me` / `badges:user:<id>`, `profile:<id>`, `challenge:<id>` (shared by Challenge-Info, progress, routine day, members, manage, invite — `loadChallenge`), `user-posts:<id>` (the pages loaded so far), `ref:*` (exercise catalog reference data, `services/exercises/exercises.service.ts`, reused for a day).
- In a component: `useCachedQuery(key, fetcher, { staleTime, persist, enabled })` → `{ data, isLoading (nothing to show yet — the only time for a skeleton), error, revalidate (fetch if stale — call from the screen's useFocusEffect), refetch (always — pull-to-refresh) }`. Paginated user posts: `hooks/useUserPosts.ts`. Imperative one-off reads: `services/cache/loaders.ts` (`loadMyChallenges`, `loadMyProfile`) and `services/cache/challengeLoaders.ts` (`loadChallenge`, `loadAllChallenges`, `loadMyPhotos` — split so challenge-only modules don't load the user service). Owner/admin changes to one challenge call `invalidateChallenge(id)`.
- Two callers of the same key share one request; a failed background refresh keeps the cached data (the toast still says what failed).
- **Mutations keep the cache true instead of refetching everything:** write the server's answer (`setQueryData` — profile edits), patch locally (`patchFeedPost` for likes/comment counts, `removePostFromCaches` for a deleted/reported post, feed/posts `loadMore` appends), or mark what changed stale with the helpers in `queries.ts` (`invalidateAfterWorkoutLogged`, `invalidateAfterMembershipChanged`, `invalidateAfterFollowChanged`, `invalidateAfterOwnPostDeleted`). An invalidated key that is on screen refetches immediately; the rest refetch the next time a screen asks. A new mutation must call the matching helper (or add one).
- The server stays the source of truth: optimistic UI (likes, follow) rolls back on failure, and a request that started before a local change never marks the entry fresh.
- Cold start: `restoreSession` signs in from the stored session immediately and validates the token with `/auth/me` in the background (a 401 still ends the session), so the first screen paints from cache instead of waiting on the network.
- Session safety: `context/authContext.tsx` scopes the cache to the signed-in user (`setQueryScope`) and wipes it, memory and disk, on logout/expired session (`clearQueryCache`). Jest clears it before every test (`jest.setup.afterEnv.js`).

## 9. UI and Component Architecture
- A screen's main call to action is `Button size="cta"` (52 tall, `body` bold, usually full width) — don't hand-build another 52px button; the older hand-built ones (Join challenge, Confirm routine, camera) can migrate to it.
- Shared reusable UI belongs in `components/ui/` (`Text`, `Button`, `Card`, `Input`, `Icon`, `IconButton`, `Loader`, etc.).
- Layout primitives belong in `components/layout/` (`ScreenBackground`, `Stack`, `Row`, `Column`, spacers, gradients).
- Feature-specific UI belongs in `components/<feature>/`, for example `components/challenge/list`, `components/challenge/detail`, `components/challenge/create`, `components/routine`, and `components/add`.
- Barrel files (`index.ts`) are common and document/export feature components.
- Styling is mostly local `StyleSheet.create` plus shared `colors`, `spacing`, `radius`, `typography`, `shadows`, and `gradients` from `constants/theme`.
- Use `useTheme()` in reusable components that should respect the theme context. Many screens also import tokens directly from `constants/theme`.
- Ionicons are the existing icon convention through `@expo/vector-icons` and local wrappers in `components/ui/icon.tsx` / `iconButton.tsx`.

## 10. Loading, Skeleton, Empty and Error States
Existing patterns:
- Loading commonly uses `ActivityIndicator` centered in a `View`, sometimes inside `ScreenBackground`.
- `components/ui/loader.tsx` provides an overlay loader.
- Empty states are usually simple centered text blocks inside the screen or list.
- Error states often use a local `error` state and show `Text` with a translated error message.
- `react-native-shimmer-placeholder` is installed, but no reusable skeleton component or project-wide skeleton pattern was found.

Recommended lightweight convention for future work: use the existing `Loader` or centered `ActivityIndicator` for blocking loads, local translated `Text` empty/error states for simple screens, and introduce a reusable skeleton only when explicitly requested or when multiple screens need the same loading layout.

## 11. Feature Implementation Rules
- Always inspect the relevant route before creating a new one.
- Do not duplicate API clients.
- Do not hardcode backend URLs if config/env support is added later; currently the base URL is hardcoded in `services/api.ts`.
- Do not bypass existing auth/token logic.
- Keep feature-specific UI inside feature folders unless it is genuinely reusable.
- Use mock data only when the task explicitly asks for static/mockup UI.
- Connect backend only when explicitly requested.
- Keep changes scoped and minimal.
- Prefer existing adapters when backend contracts differ from UI models.
- Keep translations in `i18n/resources/` when adding user-facing strings.
- Preserve route group boundaries and existing navigation patterns.

## 12. Challenge Module Map
Routes:
- `app/(tabs)/challenges.tsx`: current Challenges tab screen.
- `app/challenge/_layout.tsx`: challenge stack layout.
- `app/challenge/active-all.tsx`: full active/completed/left challenge list.
- `app/challenge/explore-all.tsx`: full explore challenge list.
- `app/challenge/create.tsx`: multi-step challenge creation screen.
- `app/challenge/[id]/_layout.tsx`: dynamic challenge detail sub-stack.
- `app/challenge/[id]/index.tsx`: challenge detail and join action.
- `app/challenge/[id]/info.tsx`: simple challenge info view.
- `app/challenge/[id]/routine/[day].tsx`: routine day detail.
- `app/challenge/routine/_layout.tsx`: routine setup stack for challenge creation.
- `app/challenge/routine/select.tsx`: assign an existing routine or rest day to a challenge day.
- `app/challenge/routine/create.tsx`: create/save a routine for a challenge day.
- `app/challenge/routine/exercises.tsx`: pick exercises from backend exercises.

Services and adapters:
- `services/challenge/challenge.service.ts`: challenge list/detail/progress/create/join/enrolled/today-routine API functions.
- `services/user/user.service.ts`: `getMyChallenges()` for enrolled challenges.
- `services/routine/routine.service.ts`: create routines and attach exercises.
- `services/exercises/exercises.service.ts`: load exercises.
- `services/workout-log/workout-log.service.ts`: create workout logs and submit workout progress.
- `services/metrics/metrics.service.ts`: add metrics to workout-log exercises.
- `services/uploads/upload.service.ts`: signed image upload flow.
- `services/adapters/challengeListAdapter.ts`, `challengeDetailAdapter.ts`, `createChallengePayloadAdapter.ts`, `metricsAdapter.ts`: challenge-related normalization.

Hooks and stores:
- `hooks/useCreateChallengeFlow.ts`: challenge create flow controller.
- `hooks/useMetricsScreen.ts`: metrics/workout progress controller tied to enrolled challenges.
- `store/challengeBuilderStore.ts`: challenge creation form state.
- `store/routineBuilderStore.ts`: routine builder and per-day assignments.
- `store/metricsEntryStore.ts`: metrics entry state.

Components:
- `components/challenge/list/`: challenge tab/list cards, badges, sections, progress bar.
- `components/challenge/detail/`: challenge detail header and routine list.
- `components/challenge/create/`: create-flow headers, steppers, inputs, actions, fixed bottom bar.
- `components/routine/`: routine builder, picker, metrics, exercise picker components.
- `components/add/`: metrics entry and rest day UI.
- `components/home/ActiveChallengeSection.tsx`: home challenge summary.

Mock data and gaps:
- `app/(tabs)/challenges.tsx` explicitly mixes real API data with `buildMockExploreChallenges()` and `buildMockRestDayChallenges()` and has `REMOVE_MOCK` comments.
- `app/challenge/[id]/routine/[day].tsx` has `ENABLE_CHALLENGE_DETAIL_MOCK = true` fallback behavior.
- `app/challenge/create.tsx` has local mock category/location option lists with comments saying they should come from backend/reference data.
- `store/routineBuilderStore.ts` contains seed routine data and a mock schema metric template.
- No dedicated challenge hooks beyond create flow were found for challenge list/detail loading.

## 12b. Notifications Module Map (B3)
Full backend/push details: `backend/docs/notificaciones/B3-NOTIFICACIONES.md`.
- `app/notifications.tsx`: inbox (cursor-paginated via `X-Next-Cursor`, read/unread, mark all, push permission card). `app/notification-settings.tsx`: per-category in-app/push switches from `GET/PATCH /notifications/preferences`.
- `services/notifications/notifications.service.ts`: API calls. `notificationRoutes.ts`: type → existing expo-router route (pure, tested; add new types here). `notificationText.ts`: i18n row text by type code (`notifications.types.*`).
- `services/notifications/pushNotifications.ts`: permission state (`blocked` = only Settings, never re-prompt), Expo token register/unregister, badge. `hooks/usePushNotifications.ts` (mounted once in `app/_layout.tsx`): unread refresh, foreground/background/cold-start taps. `hooks/usePushPermission.ts`: the in-app ask.
- `store/notificationsStore.ts`: unread count for the Home bell dot and the app badge — refreshed on events, never polled.
- Logout (`context/authContext.tsx`) removes this device's push token before clearing the session.
- Push needs an EAS projectId (`eas init` or `EAS_PROJECT_ID`) and a development build; Expo Go/simulators/web report push as unsupported and the inbox still works.

## 12c. Social Sharing Module Map (B5)
- `components/social/ShareToChatSheet.tsx`: "Send to…" sheet laid out like the Streaks grid (three round avatars + username per row, `getStreakGridLayout`, smaller avatars); tapping people selects them and a Send button appears at the bottom — only that sends (closes with a toast; failures stay selected with Retry). Recent 1:1 chats (minus unaccepted requests) plus user search; sends `POST /chats/conversations/:id/messages` with `workoutPostId` or `challengeId` (`content` optional). Optional "Other apps" row for the native share sheet. Used by `FeedPostCard` (paper plane) and the challenge detail share button.
- `utils/shareChallenge.ts`: external share text + app link (`expo-linking` `createURL('/challenge/<id>')`), also used by the routine-day share.
- `components/chats/SharedContentCard.tsx`: shared post/challenge card inside `MessageBubble` (long-press = delete your own message, with a haptic). A shared post opens `/profile/[userId]?postId=` with that post's modal open (also for your own post — no redirect to the tab then). A shared challenge renders the real `ExploreCard` from `GET /challenges/:id`. Previews come resolved per viewer (`available: false` → "no longer available", never content). `ConversationListItem` describes a share without a comment via `lastMessage.kind`.
- Reactions lead with people, not numbers: `components/social/ReactorsSummary.tsx` (from the feed's `recent_reactors`, drawn over the photo's bottom-left corner with a text shadow — `overImage`) and `ReactorsSheet.tsx` (`GET /workout-posts/:postId/reactions/users`, `X-Next-Cursor`). The like count is never rendered.
- Hashtags: typed in the camera confirm screen's caption (`app/(add)/camera.tsx`), parsed and stored by the backend (`havit.hashtags`, `havit.workout_post_hashtags`). `utils/hashtags.ts` mirrors the backend parser — keep both in sync. `components/social/HashtagText.tsx` shows tags in `activityColors.flexibility` blue, regular weight, no pill; they aren't tappable until a hashtag search exists.

## 12d. Badges and Empty States (B12)
Full decision record (computed-on-the-fly rewards, catalog, demo data): `docs/BADGES-RECOMPENSAS.md`.
- `components/badges/` (`BadgesSection`, `BadgeTile`, `BadgeDetailSheet`) renders `GET /badges/me` / `GET /badges/user/:userId` on both profiles; icon and color per badge `code` live in `constants/badges.ts`, copy in `badges.items.<code>` (backend name/description as fallback).
- `components/ui/emptyState.tsx` is the shared empty state (icon, title, message, up to two buttons toward challenges/people). Use it instead of a bare centered `Text` when a screen has somewhere useful to send the user; `components/home/EmptyFeed.tsx` is now a thin wrapper over it.

## 12e. Session hygiene, keyboard, reports (Sprint 9 follow-ups)
- `store/resetSessionStores.ts` resets every user-scoped Zustand store (challenge/routine builders, metrics entry, location choice, unread count...). `context/authContext.tsx` calls it on login, register, logout and an expired session, so a new session never starts from another user's draft. A new store that holds per-user state must be added there.
- `components/layout/keyboardAwareScroll.tsx` replaces `ScrollView` in form screens: it adds the keyboard's height as bottom padding and scrolls the focused field above the keyboard (Android's edge-to-edge screens do not resize for it).
- Reporting content hides it at once for the reporter (`ReportReasonSheet.onReported`; the server keeps it out of that user's reads while the report is pending). A moderation suspension answers writes with `403 ACCOUNT_SUSPENDED`; `services/api.ts` shows when it ends. Fixed hours per reason: `backend/docs/moderacion-manual.md`.
- "Where do you train?" is also on the register screen (`app/(add)/metrics.tsx`, via `useMetricsScreen.applyLocation`), reusing `LocationSwitchSheet`.
- Own posts load a page at a time (`getUserPosts(userId)`) in the profile grid and the "+" picker; `GET /workout-posts/mine` returns the whole history and is only used where the full list is needed.
- Both profiles (`app/(tabs)/profile.tsx`, `app/profile/[userId].tsx`) are one virtualized `PhotoGridList` (`components/profile/PhotoGrid.tsx`): header + badges (+ toggle) as the list header, photos as a 2-column FlatList (only rows near the viewport are mounted), and the next page loads as the grid nears its end — the "Load more" button stays as the visible indicator/fallback. Pages already loaded are cached per user (`useUserPosts`).
- Home/Feed layout: the feed list has no side padding; photos and both carousels (active challenges, streaks) run edge to edge, and every other row insets itself by `HOME_EDGE_INSET` (`constants/feed.ts`, `spacing.base`). `FeedPostCard`'s `edgeToEdgeInset` prop gives the Instagram layout (only Home passes it, with `FEED_POST_INSET` = `spacing.md`; the profile post viewer keeps its padded column).
- Feed performance: `FeedPostCard` mounts each of its sheets/popups (comments, reactors, share, options, report, delete) the first time it opens, not with every card; `BottomSheetModal` only listens to the keyboard while it is on screen. Photos and avatars use `resizeMethod="resize"` so Android decodes them at display size.

## 12f. Settings, training place, rewards and photo state (Sprint 10, B2)
Full record: `docs/sprint-10/B2-navegacion-comprension.md`.
- The profile's gear (`open-settings`) opens `app/profile/settings.tsx`: edit profile, notifications, legal documents (`/(auth)/legal?doc=`), about, log out and delete account, each a `components/profile/SettingsRow`. Edit profile is also the outline button in `ProfileHeader`'s `actions`. Help/FAQ (B9) is not linked until that screen exists — add a row in the "legal" section.
- Log out / delete account live in Settings; Edit profile keeps log out only on its load-error state.
- A private challenge's join button and confirmation say "Request to join" (`useConfirmationPopup` type `requestJoin`); the call is still `joinChallenge`.
- Photo review state: `POST /workout-logs/progress` returns `posts[0].moderationStatus`; `utils/photoModeration.ts` turns it into the popup line (`camera.photoStatus.*`). Own photos in `GET /workout-posts/mine|user/:me` carry `moderationStatus` (backend sends it to the author only) and `PhotoGrid` labels pending/rejected ones. Never infer "published" from a finished upload.
- Rewards: `constants/badges.ts` mirrors each badge's `metric` (`getBadgeMetric`) for the rule line in `BadgeDetailSheet`; after a completion `utils/progressLoggedFeedback.ts` reads `GET /badges/me` and `utils/challengeReward.ts` says what it earned (or how many are left). Finishing a challenge is not always a new badge.
- i18n parity: `npm run i18n:check` (`scripts/check-i18n-keys.js`) compares nested keys of `en.ts`/`es.ts`; `i18n/__tests__/parity.test.ts` enforces the same in Jest.

## 13. Do and Don't Rules
Do:
- Read this guide and inspect the target route before editing.
- Reuse `services/api.ts` and feature services.
- Use existing theme tokens, `ScreenBackground`, layout primitives, and UI components.
- Keep challenge UI in `components/challenge/*` and routine UI in `components/routine/*`.
- Use adapters for backend-to-UI mapping.
- Add loading, empty, and error states consistent with nearby screens.
- Run only available checks and state clearly when no lint/typecheck/test script exists.

Don't:
- Do not create a second API client.
- Do not bypass `AuthProvider`, `useAuth`, or token services.
- Do not add dependencies unless explicitly requested.
- Do not refactor route structure while implementing a small feature.
- Do not create duplicate screens when an existing route already matches the task.
- Do not silently keep or add mock data in backend-connected tasks.
- Do not expose secrets or copy private env values into docs or code.

## 14. Forms & Validation

As of the form-validation refactor (2026-09-04), every text-input form that needs validation uses `react-hook-form` + `zod` + `@hookform/resolvers`, with inline field-level errors instead of `Alert.alert`. This supersedes the previous library-free `useState` + hand-written validator convention for text fields specifically — multi-step builder flows (challenge/routine creation) still keep their non-text state (pill selections, cycle day config, Zustand stores) exactly as before; only the actual text fields inside them changed.

**Shared field components** (visual layer, no validation logic of its own):
- `components/ui/input.tsx` — the base `TextInput` wrapper (`default`/`filled` variants, label, counter, multiline). Gained an `error?: boolean` prop that tints the container border `colors.error`; the border is always reserved at `borderWidth: 1.5` (transparent when there's no error) so toggling the error state never shifts layout.
- `components/ui/formField.tsx` — label + `Input` + inline error message below the field (`error?: string | null`). The default field for most forms.
- `components/ui/fieldError.tsx` — **the** inline validation message (caption, `colors.error`, announced to screen readers). `FormField` renders it; screens with their own field layout (`FloatingLabelInput` on login/register/delete-account, the challenge/routine name fields) render `<FieldError message={error?.message} />` under the input. A field that turns red must also say why.
- `components/auth/FloatingLabelInput.tsx` — the auth-screen input (`error` boolean tints its border).
- `components/form/ControlledFormField.tsx` — thin `react-hook-form` `Controller` adapter. They own zero validation logic themselves; they just wire a `control`/`name` pair to the visual component above (`value`, `onChangeText`, `onBlur`, and the resolved `error.message`).

**Validation schemas** live in `validation/*Schemas.ts` (one file per form/feature: `authSchemas.ts`, `profileSchemas.ts`, `challengeSchemas.ts`, `routineSchemas.ts`, `spaceSchemas.ts`), each exporting a `createXSchema(t: TFunction)` factory (plus the `z.infer` type). Validation logic lives entirely in these files, not in components — passing the current `t` in means every error message is translated and stays in sync with the active language, same as any other `t()` call in the app. A screen builds its schema with `useMemo(() => createXSchema(t), [t])` and passes it to `useForm`'s `resolver: zodResolver(schema)`.

**Implementing a new form:**
1. Add a `createXSchema(t)` factory in `validation/` (or extend an existing one) using `zod`. Reuse `common.validation.required`/`common.validation.emailInvalid` for generic messages (`t('common.validation.required', { field: t('common.fields.x') })`), or add a screen-specific key next to the field's own label if the copy needs to be more specific (see `routineCreate.alerts.nameRequiredMessage`, `spaces.nameRequiredError` for precedent) — add the key to **both** `en.ts` and `es.ts`.
2. In the screen/component: `const schema = useMemo(() => createXSchema(t), [t]); const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: {...} });`.
3. Render each field as `<ControlledFormField control={control} name="fieldName" label={...} .../>` (or `ControlledAuthField` on an auth screen). Don't pass `value`/`onChangeText`/`error` yourself — the controller supplies them.
4. Wrap the submit handler in `handleSubmit(async (values) => {...})`.
5. Keep `Alert.alert` only for errors that aren't attributable to one on-screen field — a failed network request, a server-side auth failure, a destructive confirmation, or a step whose "fields" are non-text selections (pill grids, day lists, visibility cards) rather than `Input`s.

**Zustand-backed fields (multi-step builders):** when a field's value lives in a Zustand store shared across steps/screens (e.g. `challengeBuilderStore.title`, `routineBuilderStore.routineName`), `react-hook-form` still owns the validation/error state, but the store stays the source of truth for the value itself — see `hooks/useCreateChallengeFlow.ts` (`title`/`titleError`/`onBlurTitle`) and `app/challenge/routine/create.tsx` for the pattern: the field's `onChangeText` calls both the store setter and `setValue(name, value, { shouldValidate: hasExistingError })`, and validation is triggered explicitly (on blur, and again before advancing past that step) via `trigger(name)`.

Schemas mirror the backend DTOs: registration requires an 8+ character password (`RegisterDto @MinLength(8)`, `PASSWORD_MIN_LENGTH`), emails/usernames/display names are trimmed before validation (a trailing autofill space is not "invalid", only-spaces is empty).

## 15. Future AI Task Checklist
- Read this guide.
- Inspect relevant files.
- Identify the correct route.
- Identify component, service, hook, store, adapter, and type locations.
- Propose a short plan.
- Implement only scoped changes.
- Run available checks.
- Summarize changed files.

Profile posts: tapping a photo in a profile grid (yours or another user's) opens `app/profile/posts.tsx`, the user's posts as a feed of `FeedPostCard`s starting on the tapped one (`utils/postViewer.ts` → `store/postViewerStore.ts`; the backend's profile photos carry likes/comments/reactors/hashtags since B5). A real screen, not a modal, so what a card opens lands on top of it. `FeedPostCard`: like, comments, the challenge (trophy) and — when there are any — the logged metrics (collapsed, `stats-chart` toggle) in the actions row; your own posts show their visibility on the photo.

Invitations: there is no Invitations screen any more — pending challenge invites (received: accept/decline; sent: cancel) are a section at the top of `app/notifications.tsx` (`components/notifications/InviteNotificationRow.tsx`, same row style as a notification). `challenge_invite` notifications route to `/notifications`.

Popups: every popup goes through `components/ui/confirmationPopup.tsx` — softly blurred, darker backdrop and the `popup` black glass (`ink` tint) (`glass.popup` tokens in `constants/theme.ts`, `GlassSurface variant="popup"`). Popup icons are always `paper` (no status colors; `tone`/`iconColor` are deprecated and ignored). Every glass `BottomSheetModal` uses the same black glass (`glass.blackTintOpacity`, `ink` tint). Change the look there, not per popup.
