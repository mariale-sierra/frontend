# TROUBLESHOOTING

## Purpose

Common failures in `frontend/` and how to fix them, so a Claude Code session (or a human) doesn't re-diagnose the same issue from scratch every time.

## When to read

When `npm install`, `expo start`, or the running app misbehaves.

## Keep updated

- Whenever a new recurring failure mode is diagnosed. Add it here instead of only fixing it once.

## "npm install fails with peer dependency conflicts"

**Cause**: Expo/React Native's dependency graph regularly has peer-dependency version overlaps that plain `npm install` refuses to resolve.

**Fix**: always install with `npm install --legacy-peer-deps` in this repo, per root `CLAUDE.md`. Plain `npm install` is not "the safe default that also happens to work" here — it can produce a broken `node_modules` that half-installs. If you already ran a plain install and something looks wrong, remove `node_modules` and re-run with the flag rather than debugging the half-installed state.

## "The app shows stale code / a change isn't showing up"

**Cause**: Metro's bundler cache serving an old bundle, especially after changing `babel.config.js`, adding a native module, or editing `i18n/` resources.

**Fix**: `npx expo start -c` clears the cache before starting. Try this before assuming the code change itself is wrong.

## "Network request failed" / can't reach the backend

- The Axios base URL is **hardcoded** in `services/api.ts` to `http://20.63.84.1:3000` (plain HTTP, not env-driven — a known gap, see `docs/ai/SECURITY.md` and `docs/ai/frontend/API-CLIENT-GUIDE.md`). If that IP/port has changed, or the backend container isn't up, every request fails at the network layer before it reaches app code.
- Confirm the backend is actually running and reachable from the device/emulator: an Android emulator or physical device on a different network than the backend host will fail even though the code is correct.
- The response interceptor in `services/api.ts` maps `error.message === 'Network Error'` to a "connection error" toast (currently hardcoded in Spanish regardless of device language — see `docs/ai/frontend/I18N-GUIDE.md`'s "Known gap" section) — seeing that toast specifically (vs. a 401/403/404/500 toast) means the request never reached the server at all, so look at connectivity/base URL first, not backend logic.

## "I'm logged out unexpectedly" / session issues

- Session restore/validation happens in `context/authContext.tsx` via `GET /auth/me`: a `401` response clears the session (expected — the token expired or is invalid), any other error (network, 500) **preserves** the existing session rather than logging the user out — so an unexpected logout specifically (not just an error toast) points at a real 401, which per the backend's `docs/ai/TROUBLESHOOTING.md` usually means an expired (7-day) or mismatched-secret token.
- The JWT is currently stored in `AsyncStorage` (not `expo-secure-store` yet — target state described in `docs/ai/SECURITY.md`). If the token looks present in storage but requests still 401, check for a stale/corrupted value rather than assuming the storage mechanism itself is at fault.
- Known bug: `hooks/useChallengeProgress.ts` holds a **module-level `cachedProgress` variable that is never invalidated** on login/logout. If a new user logs in on the same device/session and sees a previous user's challenge progress, this is why — it's a documented issue (plan §3.6), not something to work around per-screen; the real fix is invalidating the cache on login/logout in that hook.

## "A screen shows English/Spanish text I didn't expect, or a literal key like `challenges.screenTitle`"

- A raw key path rendering as text (instead of translated text) means the key is missing from the resource file for the active language — check both `i18n/resources/en.ts` and `i18n/resources/es.ts` for that exact key path; `fallbackLng: 'es'` only helps if the key exists in `es.ts`.
- Device language detection is in `i18n/index.ts`: only `en`/`es` are recognized (anything else falls back to `es`), based on `expo-localization`'s `getLocales()`. If a device set to a third language shows unexpected Spanish, that's expected per the current logic, not a bug.
- Some UI strings and all of `services/api.ts`'s error toasts are still hardcoded outside `t()` (see `docs/ai/frontend/I18N-GUIDE.md`) — those won't respond to a language change at all; that's a known gap, not a translation-file bug to chase.

## "Password/sensitive data showing up in logs/console"

Known, verified issue: `services/auth/auth.service.ts`'s `login()` currently does `console.log('login function called with:', email, password)` — the password is logged in plaintext. Don't add more of this pattern (`console.log` of credentials/tokens/PII) anywhere else; if you're touching this file, remove the existing line rather than leaving it.

## Related docs

- `backend/docs/ai/SECURITY.md` — the base-URL/token-storage/logging gaps referenced above (the security doc lives in the backend repo's tree; the per-user security model applies to both repos).
- `frontend/docs/ai/frontend/I18N-GUIDE.md` — the translation-key and hardcoded-string issues in full.
- `frontend/docs/ai/CURRENT-STATE.md` — known mock-data and stub-screen gaps that can look like bugs but are documented incomplete features.

> Must reflect real, reproduced failure modes — not speculation. Add a new entry only after actually hitting and diagnosing it.
