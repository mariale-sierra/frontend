import '../../../i18n';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { LegalConsent } from '../LegalConsent';
import { LEGAL_DOCS } from '../../../constants/legal/legalDocs';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('LegalConsent', () => {
  it('toggles each consent independently and reports the new value', async () => {
    const onChange = jest.fn();
    const screen = await renderWithTheme(
      <LegalConsent value={{ acceptTerms: false, confirmAge16: false }} onChange={onChange} />,
    );

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(2);

    await fireEvent.press(boxes[0]);
    expect(onChange).toHaveBeenLastCalledWith({ acceptTerms: true, confirmAge16: false });

    await fireEvent.press(boxes[1]);
    expect(onChange).toHaveBeenLastCalledWith({ acceptTerms: false, confirmAge16: true });
  });

  it('reflects the checked state for accessibility', async () => {
    const screen = await renderWithTheme(
      <LegalConsent value={{ acceptTerms: true, confirmAge16: false }} onChange={jest.fn()} />,
    );
    const [terms, age] = screen.getAllByRole('checkbox');
    expect(terms.props.accessibilityState?.checked).toBe(true);
    expect(age.props.accessibilityState?.checked).toBe(false);
  });
});

describe('legal documents', () => {
  it('ships the three documents with content', () => {
    for (const key of ['terms', 'privacy', 'community'] as const) {
      expect(LEGAL_DOCS[key].title.length).toBeGreaterThan(0);
      expect(LEGAL_DOCS[key].sections.length).toBeGreaterThan(0);
    }
  });

  it('states the 16+ minimum age in the privacy policy', () => {
    const text = JSON.stringify(LEGAL_DOCS.privacy);
    expect(text).toContain('16 años');
  });
});
