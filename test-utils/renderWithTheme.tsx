import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../context/themeContext';
import type { ReactElement } from 'react';

/**
 * Shared test render: wraps the component under test in the app's
 * ThemeProvider (required by Text/Button/etc. via useTheme). RNTL v14's
 * render is async — always `await renderWithTheme(...)`.
 */
export function renderWithTheme(ui: ReactElement) {
  return render(ui, { wrapper: ThemeProvider });
}
