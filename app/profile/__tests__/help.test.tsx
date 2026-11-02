import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import en from '../../../i18n/resources/en';
import es from '../../../i18n/resources/es';
import HelpScreen, { HELP_SECTIONS } from '../help';

// Sprint 10, B9: Help / FAQ opened from Settings; answers expand in place.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useLocalSearchParams: () => ({}) };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));

type Sections = Record<string, { title: string; items: Record<string, { q: string; a: string }> }>;

describe('Help / FAQ screen (B9)', () => {
  it('shows the challenges, progress, privacy and posts sections', async () => {
    const screen = await renderWithTheme(<HelpScreen />);

    for (const section of ['challenges', 'progress', 'privacy', 'posts']) {
      expect(screen.getByText(`help.sections.${section}.title`)).toBeTruthy();
    }
  });

  it('keeps answers collapsed until the question is tapped, and collapses again', async () => {
    const screen = await renderWithTheme(<HelpScreen />);

    expect(screen.queryByTestId('help-challenges-join-answer')).toBeNull();

    await fireEvent.press(screen.getByTestId('help-challenges-join'));
    expect(screen.getByText('help.sections.challenges.items.join.a')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('help-challenges-join'));
    expect(screen.queryByTestId('help-challenges-join-answer')).toBeNull();
  });

  it.each([
    ['en', en],
    ['es', es],
  ])('every listed question has copy in %s', (_lang, resources) => {
    const sections = (resources as unknown as { help: { sections: Sections } }).help.sections;
    for (const [section, items] of Object.entries(HELP_SECTIONS)) {
      expect(sections[section].title).toBeTruthy();
      for (const item of items) {
        expect(sections[section].items[item].q).toBeTruthy();
        expect(sections[section].items[item].a).toBeTruthy();
      }
    }
  });
});
