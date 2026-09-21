import { StyleSheet, Text as RNText } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SpaceCardView } from '../SpaceCardView';
import { activityColors, fontSize, spacing } from '../../../constants/theme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
  }),
}));

const baseProps = {
  name: 'Girls running club',
  description: 'Sunrise 5Ks and slow jogs.',
  membersCount: 50,
  accentColor: activityColors.cardioLow,
};

describe('SpaceCardView', () => {
  it('shows the name, the description and the member count — and no activity badge', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} />);

    expect(screen.getByText('Girls running club')).toBeTruthy();
    expect(screen.getByText('Sunrise 5Ks and slow jogs.')).toBeTruthy();
    expect(screen.getByText('spaces.membersCount:50,50')).toBeTruthy();
  });

  it('gives the description up to two lines, and the name one', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} />);

    expect(screen.getByText('Sunrise 5Ks and slow jogs.').props.numberOfLines).toBe(2);
    expect(screen.getByText('Girls running club').props.numberOfLines).toBe(1);
  });

  it('keeps the card short: an 18px name and a caption-size description', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} />);

    expect(StyleSheet.flatten(screen.getByText('Girls running club').props.style).fontSize).toBe(fontSize.lg);
    expect(StyleSheet.flatten(screen.getByText('Sunrise 5Ks and slow jogs.').props.style).fontSize).toBe(fontSize.xs);
  });

  it('leaves out the description when there is none', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} description={null} />);

    expect(screen.queryByText('Sunrise 5Ks and slow jogs.')).toBeNull();
    expect(screen.getByText('Girls running club')).toBeTruthy();
  });

  it('shows the call to action beside the member count when there is one', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} cta={<RNText>join-pill</RNText>} />);

    expect(screen.getByText('join-pill')).toBeTruthy();
    expect(screen.getByText('spaces.membersCount:50,50')).toBeTruthy();
  });

  it('shows no call to action without one', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} />);

    expect(screen.queryByText('join-pill')).toBeNull();
  });

  // The card has its own look: roomier than the challenge cards, and a half-moon of
  // light from the top AND the bottom edge.
  it('gives the content more room from the card edges than the challenge cards have', async () => {
    const screen = await renderWithTheme(<SpaceCardView {...baseProps} />);
    const tree = JSON.stringify(screen.toJSON());

    expect(tree).toContain(`"paddingHorizontal":${spacing.lg}`);
    expect(tree).toContain(`"paddingVertical":${spacing.base}`);
  });
});
