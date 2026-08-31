import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './resources/en';
import es from './resources/es';

const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

export type SupportedLanguage = 'en' | 'es';

// Real bug, fixed 2026-08-29, per explicit report ("the language toggle
// doesn't work at all, it defaults to English, but then you check the
// toggle and it says spanish"): nothing anywhere in the app ever called
// i18n.changeLanguage() — the Edit Profile language dropdown only PATCHed a
// `preferred_language` field on the backend profile and displayed whatever
// that field last held, completely disconnected from the actual active
// i18next language, which was set exactly once at boot from the device
// locale and never touched again. `PREFERRED_LANGUAGE_KEY` persists the
// user's real in-app choice locally (device locale is just the fallback for
// a user who's never picked one).
//
// This file deliberately does NOT import `utils/storage`/AsyncStorage, and
// has no `applyPersistedLanguage`/`setAppLanguage` helpers of its own — a
// first attempt put them here (first with a top-level import, which broke a
// previously-passing test by dragging AsyncStorage into every test that
// merely imports `i18n`; then with a lazy `await import()`, which turned out
// unreliable at runtime under this project's Metro/Hermes setup — the toggle
// stayed completely non-functional even after that "fix"). Storage
// read/write now lives directly in the two call sites instead — app/_layout.tsx
// (read on mount) and app/profile/edit.tsx (write on selection) — both
// already import `utils/storage` the same plain top-level way dozens of
// other files in this app do successfully, no indirection.
export const PREFERRED_LANGUAGE_KEY = 'preferredLanguage';

const deviceLanguage = getLocales()?.[0]?.languageCode ?? 'es';
const supportedLanguage: SupportedLanguage = deviceLanguage === 'en' ? 'en' : 'es';

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: supportedLanguage,
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    })
    .catch((error) => {
      console.error('[i18n] initialization failed', error);
    });
}

export default i18n;
