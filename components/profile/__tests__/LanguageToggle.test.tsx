import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { LanguageToggle } from '../LanguageToggle';

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Sprint 10, B10: extracted from app/profile/edit.tsx; the screen still applies
// and persists the language, the toggle only reports the choice.
describe('LanguageToggle', () => {
  it('marks the active language as selected', async () => {
    const screen = await renderWithTheme(<LanguageToggle value="es" onChange={jest.fn()} />);

    expect(screen.getByTestId('language-option-es').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('language-option-en').props.accessibilityState).toEqual({ selected: false });
  });

  it('reports the other language when it is tapped', async () => {
    const onChange = jest.fn();
    const screen = await renderWithTheme(<LanguageToggle value="es" onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('language-option-en'));

    expect(onChange).toHaveBeenCalledWith('en');
  });

  it('does nothing when the active language is tapped again', async () => {
    const onChange = jest.fn();
    const screen = await renderWithTheme(<LanguageToggle value="en" onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('language-option-en'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
