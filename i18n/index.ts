import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './resources/en';
import es from './resources/es';

const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

const deviceLanguage = getLocales()?.[0]?.languageCode ?? 'es';
const supportedLanguage = deviceLanguage === 'en' ? 'en' : 'es';

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
