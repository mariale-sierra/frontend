import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../context/themeContext';
// Side-effect import: initializes i18next (see i18n/index.ts). Any component
// under test that calls `useTranslation()` (ActiveChallengeSection, the Home
// screen, etc.) needs this or it throws / falls back to raw key names.
// i18n/index.ts falls back to 'es' whenever expo-localization can't resolve a
// device locale, which is always the case under Jest — so components render
// their Spanish copy ("Completado", "Sin reto activo", etc.) in tests.
import '../i18n';

/**
 * Most UI components in this app read from ThemeContext (via `useTheme()` in
 * `components/ui/text.tsx`, `components/ui/icon.tsx`, `components/ui/loader.tsx`,
 * etc.) and will throw "useTheme must be used within a ThemeProvider" if
 * rendered without it. Use this instead of RNTL's bare `render()` for any
 * component/screen that isn't a pure leaf with no theme/i18n dependency.
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(<ThemeProvider>{ui}</ThemeProvider>, options);
}

export * from '@testing-library/react-native';
