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
- Lint: no script exists.
- Typecheck: `npm run typecheck` (`tsc --noEmit`).
- Test: `npm test` (Jest).

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

- Root layout: `app/_layout.tsx` wraps the app in `ThemeProvider` and `AuthProvider`, restores auth, redirects unauthenticated users to `/(auth)/login`, and registers stack screens.
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

There are four routable tabs inside one capsule: `index` (Home), `search`, `challenges`, and `profile`. The `add` route remains registered only because Expo Router needs a file for it, but its separate right-hand `+` action prevents `tabPress` and opens `/log` directly.

The navbar implementation is deliberately split across:
- `components/navigation/bottomNavBackground.tsx`: decorative capsule, blur, and one shared indicator.
- `components/navigation/bottomNavIndicator.tsx`: the single oval that translates between tab slots.
- `components/navigation/bottomNavTabButton.tsx`: explicit `Tap` and `Pan` gestures for tab selection and horizontal dragging.
- `components/navigation/bottomNavContext.tsx`: shared visual state and the UI-thread spring/stretch sequence.
- `constants/bottomNav.ts`: geometry, icon/label/FAB presentation settings, and motion settings used by both the drawing and interactive layers.

`activeIndex` is a Reanimated `SharedValue` representing only the visual position (continuous from 0 through 3), not React Navigation's discrete route state. The selector, outline/filled icon opacity, icon color, and label color all derive directly from that same shared value on the UI thread, with no React-state or intermediate-derived visual state. A drag writes this value on the UI thread, bounds it to the first/last tab, then rounds and springs to the nearest slot on release before a single JS bridge requests navigation. A tap starts that same spring before navigation. Route selection is only a fallback synchronizer for external navigation; a matching route update from the gesture is ignored so it cannot reset or restart an in-flight animation. Tab option render props are memoized and inactive screens use `freezeOnBlur` so opening a screen does not also reconcile inactive tab content. `BOTTOM_NAV_HEIGHT` is the single shared outer-height source: the capsule uses it directly and the FAB derives both width and height from it, with half-height radii so the pair remains aligned as a capsule and a true circle. Its labels use a local compact treatment so their visual weight remains balanced in the taller capsule. `BOTTOM_NAV_INDICATOR_EXTRA_WIDTH` widens the selector while recalculating the four tab slots and their outer insets from the same geometry: icons and selector centers remain aligned, including Home and Profile. It never changes route state or spring behavior.

Do not set `tabBarStyle` or use a fully custom `tabBar`: on iOS with Fabric enabled, both have historically made the whole bar unresponsive. Preserve the existing `tabBarBackground` plus custom `tabBarButton` extension points. To change tab metadata, icons, ordering, or behavior, edit `app/(tabs)/_layout.tsx`; keep geometry and indicator motion synchronized through `constants/bottomNav.ts` rather than duplicating values.

## 7. API and Backend Integration
- API client: `services/api.ts`.
- Base URL: currently hardcoded as `http://20.63.84.1:3000` in `services/api.ts`.
- Token injection: `services/api.ts` has an Axios request interceptor that calls `getAccessToken()` and sets `Authorization: Bearer <token>`.
- 401 handling: the Axios response interceptor logs 401s and rejects the error.
- Token storage: `services/auth/token.service.ts` keeps the access token in memory and hydrates it from `utils/storage.ts`.
- AsyncStorage wrapper: `utils/storage.ts` wraps `AsyncStorage.getItem`, `setItem`, and `removeItem`.
- Auth service: `services/auth/auth.service.ts` calls `/auth/login`, `/auth/register`, stores token, `userId`, and `username`, and clears them on logout.
- Auth context: `context/authContext.tsx` restores session using stored values and validates `/auth/me`; 401 clears session, non-401 errors preserve the stored session.
- Service convention: services live under `services/<feature>/<feature>.service.ts`, import the shared `api`, return `response.data`, and use typed contracts from `types/`.
- Adapters: `services/adapters/` normalize backend contracts into UI view models and payloads.
- Upload convention: `services/uploads/upload.service.ts` signs via the API, then uses native `fetch` for the signed URL PUT because Axios baseURL/auth headers would break pre-signed uploads.

Future services should reuse `services/api.ts`, avoid creating another Axios client, preserve token logic, add typed request/response contracts under `types/`, and normalize backend shapes through adapters when UI view models differ from API contracts.

## 8. State, Hooks, and Contexts
- `context/authContext.tsx`: global auth/session state and login/register/logout actions.
- `context/themeContext.tsx`: exposes theme tokens from `constants/theme`.
- `hooks/useAuth.ts` and `hooks/useTheme.ts`: thin wrappers around their contexts.
- `hooks/useCreateChallengeFlow.ts`: orchestrates challenge creation state, validation, payload building, backend submit, and navigation.
- `hooks/useMetricsScreen.ts`: coordinates enrolled challenges, today's routine, workout log creation, metric submit, loading/error state, and navigation.
- `hooks/useFilteredExercises.ts`: filters exercise candidates for routine exercise selection.
- Zustand stores in `store/`: hold multi-screen local builder state for challenges, routines, and metrics.

Prefer hooks for screens that coordinate services, stores, translations, routing, alerts, loading, and errors. Direct service calls are acceptable in small screens, but shared or multi-step behavior should move into a hook or store following existing patterns.

## 9. UI and Component Architecture
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
- `components/auth/auth-input.tsx` / `components/auth/auth-form-field.tsx` — the auth-screen variant (recessed `ink` fill, `primary` focus border, `error` overrides the focus border to `colors.error`). Same error-message-below pattern as `FormField`, kept as a separate component because its visual treatment is a real, pre-existing, legitimate difference from the default field — not a duplicate.
- `components/form/ControlledFormField.tsx` / `components/form/ControlledAuthField.tsx` — thin `react-hook-form` `Controller` adapters. They own zero validation logic themselves; they just wire a `control`/`name` pair to the visual component above (`value`, `onChangeText`, `onBlur`, and the resolved `error.message`).

**Validation schemas** live in `validation/*Schemas.ts` (one file per form/feature: `authSchemas.ts`, `profileSchemas.ts`, `challengeSchemas.ts`, `routineSchemas.ts`, `spaceSchemas.ts`), each exporting a `createXSchema(t: TFunction)` factory (plus the `z.infer` type). Validation logic lives entirely in these files, not in components — passing the current `t` in means every error message is translated and stays in sync with the active language, same as any other `t()` call in the app. A screen builds its schema with `useMemo(() => createXSchema(t), [t])` and passes it to `useForm`'s `resolver: zodResolver(schema)`.

**Implementing a new form:**
1. Add a `createXSchema(t)` factory in `validation/` (or extend an existing one) using `zod`. Reuse `common.validation.required`/`common.validation.emailInvalid` for generic messages (`t('common.validation.required', { field: t('common.fields.x') })`), or add a screen-specific key next to the field's own label if the copy needs to be more specific (see `routineCreate.alerts.nameRequiredMessage`, `spaces.nameRequiredError` for precedent) — add the key to **both** `en.ts` and `es.ts`.
2. In the screen/component: `const schema = useMemo(() => createXSchema(t), [t]); const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: {...} });`.
3. Render each field as `<ControlledFormField control={control} name="fieldName" label={...} .../>` (or `ControlledAuthField` on an auth screen). Don't pass `value`/`onChangeText`/`error` yourself — the controller supplies them.
4. Wrap the submit handler in `handleSubmit(async (values) => {...})`.
5. Keep `Alert.alert` only for errors that aren't attributable to one on-screen field — a failed network request, a server-side auth failure, a destructive confirmation, or a step whose "fields" are non-text selections (pill grids, day lists, visibility cards) rather than `Input`s.

**Zustand-backed fields (multi-step builders):** when a field's value lives in a Zustand store shared across steps/screens (e.g. `challengeBuilderStore.title`, `routineBuilderStore.routineName`), `react-hook-form` still owns the validation/error state, but the store stays the source of truth for the value itself — see `hooks/useCreateChallengeFlow.ts` (`title`/`titleError`/`onBlurTitle`) and `app/challenge/routine/create.tsx` for the pattern: the field's `onChangeText` calls both the store setter and `setValue(name, value, { shouldValidate: hasExistingError })`, and validation is triggered explicitly (on blur, and again before advancing past that step) via `trigger(name)`.

## 15. Future AI Task Checklist
- Read this guide.
- Inspect relevant files.
- Identify the correct route.
- Identify component, service, hook, store, adapter, and type locations.
- Propose a short plan.
- Implement only scoped changes.
- Run available checks.
- Summarize changed files.
