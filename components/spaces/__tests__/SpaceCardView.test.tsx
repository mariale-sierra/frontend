import { StyleSheet, Text as RNText } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SpaceCardView } from '../SpaceCardView';
import { LINEAR_GLOW } from '../../ui/accentCard';
import { activityColors, borderWidth, colors, fontSize, spacing } from '../../../constants/theme';
import { boostSaturation, withAlpha } from '../../../utils/color';

// The glow is drawn once the card has been measured; this hands it a size at once.
jest.mock('../../ui/accentGlow', () => ({
  AccentGlow: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 342, height: 140 }),
}));
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
  activityType: 'cardioLow' as const,
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

  // Real change 2026-09-25, replacing a long chain of attempts at
  // `AccentCard`'s dome/bloom system (a half-moon from the bottom edge,
  // matching Home's hero card and Mine's cards) with `linearGlow` — a
  // plain diagonal `LinearGradient`, `ink` at the top-left to the space's
  // own full, vivid activity color at the bottom-right. See SpaceCardView
  // itself for the fuller "why" (an attached reference image showed a
  // completely different, much simpler shape than the dome was ever
  // going to produce).
  describe('its glow — a vertical gradient, ink at the top to the activity color at the bottom (B5)', () => {
    const treeOf = async (props: Partial<Parameters<typeof SpaceCardView>[0]> = {}) =>
      JSON.stringify((await renderWithTheme(<SpaceCardView {...baseProps} {...props} />)).toJSON());
    // AccentCard's LINEAR_GLOW: the color, boosted, rising down the card.
    const stops = (color: string) => {
      const vivid = boostSaturation(color, LINEAR_GLOW.vividFactor);
      return LINEAR_GLOW.stops.map(([, opacity]) => withAlpha(vivid, opacity));
    };

    it('runs straight down, from the top edge to the bottom edge', async () => {
      const tree = await treeOf();

      expect(tree).toContain('"start":{"__typename__":"Point","ref":{"0":0,"1":0}}');
      expect(tree).toContain('"end":{"__typename__":"Point","ref":{"0":0,"1":140}}');
      expect(tree).toContain(`"positions":${JSON.stringify(LINEAR_GLOW.stops.map(([offset]) => offset))}`);
      // A soft fade, not steps: it starts at nothing, never drops, collects
      // at the bottom, and no two neighbouring samples jump by much.
      const opacities = LINEAR_GLOW.stops.map(([, opacity]) => opacity);
      expect(opacities[0]).toBe(0);
      opacities.slice(1).forEach((opacity, i) => {
        expect(opacity).toBeGreaterThanOrEqual(opacities[i]);
        expect(opacity - opacities[i]).toBeLessThanOrEqual(0.25);
      });
      expect(opacities[opacities.length - 1]).toBeGreaterThan(opacities[Math.floor(opacities.length / 2)] * 2);
    });

    it("rises to the space's own activity color, more saturated, short of full strength", async () => {
      expect(await treeOf()).toContain(`"colors":${JSON.stringify(stops(activityColors.cardioLow))}`);
      expect(await treeOf({ activityType: 'strength' })).toContain(
        `"colors":${JSON.stringify(stops(activityColors.strength))}`,
      );
    });

    it('is the neutral color for a space with no activity yet', async () => {
      expect(await treeOf({ activityType: null })).toContain(`"colors":${JSON.stringify(stops(colors.primary))}`);
    });

    it("has a 1px outline — thicker than the challenge cards' hairline", async () => {
      expect(await treeOf()).toContain(`"borderWidth":${borderWidth.thin}`);
    });
  });
});
