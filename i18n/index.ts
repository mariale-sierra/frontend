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
// a user who's never picked one), read back by `applyPersistedLanguage()`.
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

/** Applies a previously-persisted language choice, if any, over the
 * device-locale default init() above already picked. Async (AsyncStorage),
 * so this can only run after the first render — called once from
 * app/_layout.tsx on mount. A user who's never actually picked a language
 * in the app has nothing persisted yet, so this is a no-op and the device
 * locale keeps deciding, same as before this fix.
 *
 * `utils/storage` (AsyncStorage) is required lazily, INSIDE this function,
 * not imported at module top-level — real regression caught 2026-08-29:
 * a top-level import here made merely importing `i18n` (which
 * test-utils/renderWithProviders.tsx does, unmocked, since component tests
 * need the real translation strings) drag in the real AsyncStorage native
 * module, breaking a previously-passing test the same way the already-known
 * app/(tabs)/__tests__/index.test.tsx failure happens. Deferring the
 * require to here means only actually CALLING this function touches
 * AsyncStorage at all. */
export async function applyPersistedLanguage(): Promise<void> {
  try {
    const { storage } = await import('../utils/storage');
    const saved = await storage.getItem(PREFERRED_LANGUAGE_KEY);
    if ((saved === 'en' || saved === 'es') && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch (error) {
    console.error('[i18n] failed to apply persisted language', error);
  }
}

/** Switches the app's active language immediately and persists the choice
 * so it survives app restarts, independent of the device's own locale
 * setting. Call this directly on selection (Edit Profile's language
 * dropdown), not only after a backend save succeeds — a language toggle is
 * expected to have an instant, visible effect. Lazily requires
 * `utils/storage` for the same reason `applyPersistedLanguage` above does. */
export async function setAppLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    const { storage } = await import('../utils/storage');
    await storage.setItem(PREFERRED_LANGUAGE_KEY, language);
  } catch (error) {
    console.error('[i18n] failed to persist language choice', error);
  }
}

export default i18n;
