# I18N-GUIDE

## Purpose

How translation resources are structured, the rules for adding a string or a language, and how backend error `code`s should map to translated messages. Read this before adding any user-visible text.

## When to read

Before adding, changing, or removing any user-visible string, and before touching `i18n/`.

## Keep updated

- Whenever the resource structure (top-level namespaces) changes.
- Whenever the error-`code` mapping described below is actually implemented.

## Structure

- `i18n/index.ts` wires `i18next` + `react-i18next`, registers `en`/`es` under `resources`, picks the device language via `expo-localization`'s `getLocales()` (falls back to `es` if unsupported), and sets `fallbackLng: 'es'`.
- `i18n/resources/en.ts` and `i18n/resources/es.ts` each export a single default object (`en`/`es`), same shape, 266 lines each today. Nested by feature/screen namespace, e.g.:
  ```ts
  const en = {
    common: { actions: { login: 'Log in', ... }, fields: { email: 'Email', ... }, errors: { genericTitle: 'Error' } },
    auth: { login: { title: 'Havit', subtitle: 'Welcome back', ... }, register: { ... } },
    challenges: { screenTitle: 'Challenges', activeTitle: 'Active challenges', ... },
    // ...
  };
  ```
  Follow the existing namespace for a screen/feature (`auth.login.*`, `challenges.*`, etc.) rather than inventing a new top-level key for a string that belongs under an existing one.
- Screens read via `useTranslation()` from `react-i18next` and call `t('namespace.key')`, with interpolation (`t('challenges.streakLabel', { count })` → `'{{count}} streak'` in the resource).

## Rule: every key in BOTH files

Every key added to `en.ts` **must** have the same key path added to `es.ts` in the same change, and vice versa. A key present in only one file is an incomplete change — `fallbackLng: 'es'` means a missing Spanish key silently falls through to whatever `i18next` does with a missing key (typically rendering the key path itself), which is a visible bug in production. There is currently no automated check for this (see `frontend/docs/ai/frontend/TESTING-GUIDE.md`'s priority list item "i18n key parity between `en.ts` and `es.ts`" — write that test as part of adopting the test framework).

## Rule: correct Spanish accents

**Fixed 2026-07-15** — `es.ts` previously had a systematic missing-accent pattern across the whole file (`'Iniciar sesion'` → `'Iniciar sesión'`, `'Contrasena'` → `'Contraseña'`, `'Atras'` → `'Atrás'`, plus every `dia`/`categoria`/`ubicacion`/`duracion`/`descripcion`/`publico`/`titulo`/`aun` root, etc.). All of it was corrected in one pass, not just new keys. **New Spanish strings must keep using correct tildes/ñ** — this is now a maintained convention, not aspirational. Note: only missing accent marks (á/é/í/ó/ú/ñ) were fixed — the separate `¿`/`¡` inverted-punctuation gap (e.g. `'No tienes cuenta?'` instead of `'¿No tienes cuenta?'`) was left alone as a distinct, smaller cleanup item, not silently expanded into this change.

## Hardcoded strings

**Closed 2026-07-15** — the ~20-string gap tracked here (stub screens, `(tabs)/index.tsx`, `(tabs)/add.tsx`, `(tabs)/search.tsx`, `challenge/[id]/index.tsx`, `challenge/routine/select.tsx`, `exerciseMetricsEditor.tsx`, `exerciseNoteField.tsx`, `challengeRoutineList.tsx`, `(add)/plan-rest-days.tsx`, `(add)/camera.tsx`, `exerciseHeader.tsx`'s `Alert.alert`) was swept into `t()`, ~35 new keys added to both `en.ts`/`es.ts`. This also caught and fixed a subtler bug: several `t(key, { defaultValue: '...' })` calls (in `challenge/[id]/index.tsx` and `challenge/[id]/routine/[day].tsx`) referenced keys that didn't actually exist in the resources, meaning the `defaultValue` (always English) silently did all the rendering work regardless of device language — Spanish users were seeing English text with no way to tell from the code that i18n was "wired up." Real keys now exist for all of them; don't reintroduce the `defaultValue`-as-translation pattern — if a key doesn't exist yet, add it to both resource files instead of leaning on `defaultValue`.

Don't add a new hardcoded string "to match the surrounding style" going forward — there is no longer a surrounding-gap excuse for the files listed above.

## Fixed gap: API errors now go through i18n

**Fixed 2026-07-15** — `services/api.ts`'s response interceptor previously hardcoded Spanish-only strings directly in the `.ts` file for 401/403/404/500/network/unknown. It now calls `i18n.t('common.errors.<key>')` (imports the `i18n` singleton from `i18n/index.ts` directly, since the interceptor runs outside any React component and can't use the `useTranslation()` hook) for `sessionExpiredTitle`/`Message`, `forbiddenTitle`/`Message`, `notFoundTitle`/`Message`, `serverErrorTitle`/`Message`, `networkErrorTitle`/`Message`, and the generic fallback (`genericTitle`/`genericMessage`). The backend-provided `error.response.data.message` branch (used when the server sends its own message) is intentionally left as-is — that's server-controlled content, not a UI string this repo owns.

## How to add a text key

1. Pick the right namespace (an existing feature/screen namespace beats a new top-level one).
2. Add the key to **`en.ts`**, with correct English text.
3. Add the same key path to **`es.ts`**, with correctly accented Spanish text.
4. Use it via `useTranslation()`'s `t('namespace.key')`, with `{{var}}` interpolation if needed (`escapeValue: false` is set, so no manual escaping).
5. Never merge a change that adds a key to only one file.

## How to add a language

1. Create `i18n/resources/<lang>.ts` mirroring the full shape of `en.ts`/`es.ts` — every key path from both existing files must be present (no partial translation files).
2. Register it in `i18n/index.ts`'s `resources` object: `<lang>: { translation: <lang> }`.
3. Decide whether it should be selectable by device locale (`expo-localization`'s `getLocales()`-based detection, currently only recognizing `en` vs. falling back to `es`) or via an in-app language switcher (none exists today) — extending the `supportedLanguage` check in `i18n/index.ts` either way.
4. Do not change `fallbackLng` away from `'es'` as a side effect of adding a language, unless that's the explicit goal of the change.

## Mapping API error `code` → translation (target, depends on backend work)

Once the backend's exception filter adds a stable `code` field to error responses (see `backend/docs/ai/backend/ERROR-HANDLING.md` — **not implemented yet**, current errors have no `code`), the frontend should:

1. Add an `errors` namespace keyed by the backend's `code` values, in both `en.ts`/`es.ts`, e.g.:
   ```ts
   errors: {
     ROUTINE_NOT_FOUND: 'Routine not found',       // en.ts
     ROUTINE_NOT_FOUND: 'Rutina no encontrada',     // es.ts
     NOT_OWNER: 'You do not have permission to do this',
     // ...
   }
   ```
2. In `services/api.ts`'s response interceptor, check `error?.response?.data?.code` first; if present, show `i18n.t('errors.' + code)`. Fall back to the current status-based generic messages (translated via `t()` instead of hardcoded, see the gap above) when `code` is absent — which will still be the common case until the backend migrates its `new Error()` call sites (tracked in `ERROR-HANDLING.md`).
3. This mapping is the frontend half of plan §4.3 "Errores estandarizados end-to-end" — don't build it against a `code` the backend doesn't send yet; coordinate with whoever is doing the backend exception-filter work.

## Related docs

- `backend/docs/ai/backend/ERROR-HANDLING.md` — the backend side of the `code` → i18n mapping.
- `frontend/docs/ai/frontend/TESTING-GUIDE.md` — the key-parity test this guide calls for.
- `frontend/docs/ai/CURRENT-STATE.md` — current stub screens whose strings aren't in `t()` yet.

> Must reflect the real current i18n structure and gaps, not assumptions. If a hardcoded-string count or gap listed above is fixed, update this file in the same change.
