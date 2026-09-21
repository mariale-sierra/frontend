import { StyleSheet, Text as RNText } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SpaceCardView } from '../SpaceCardView';
import { activityColors, colors, fontSize, spacing } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import { ACCENT_VIVID_FACTOR } from '../../ui/accentDome';
import { boostSaturation, rotateHue, withAlpha } from '../../../utils/color';

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

  describe('its glow — orbs of light', () => {
    const treeOf = async (props: Partial<Parameters<typeof SpaceCardView>[0]> = {}) =>
      JSON.stringify((await renderWithTheme(<SpaceCardView {...baseProps} {...props} />)).toJSON());
    const orbColor = (type: keyof typeof activityColors, hue: number, peak: number) =>
      withAlpha(rotateHue(boostSaturation(activityColors[type], ACCENT_VIVID_FACTOR), hue), peak);

    it("draws the `space` mesh recipe, in the space's activity color", async () => {
      const tree = await treeOf();
      const dominant = getMeshRecipe('space', 'cardioLow').blobs.find((orb) => orb.hue === 0)!;

      expect(tree).toContain(orbColor('cardioLow', 0, dominant.peak));
    });

    it('draws every one of its orbs, one gradient each', async () => {
      const tree = await treeOf();
      const { blobs } = getMeshRecipe('space', 'cardioLow');

      // One dithered gradient per orb, and one more for the scrim.
      expect(tree.match(/"dither":true/g)).toHaveLength(blobs.length + 1);
    });

    it("takes another activity's colors, and its own composition", async () => {
      const strength = await treeOf({ activityType: 'strength' });
      const dominant = getMeshRecipe('space', 'strength').blobs.find((orb) => orb.hue === 0)!;

      expect(strength).toContain(orbColor('strength', 0, dominant.peak));
      expect(strength).not.toBe(await treeOf());
    });

    it('is the neutral, quieter orbs for a space with no activity yet', async () => {
      const tree = await treeOf({ activityType: null });
      const dominant = getMeshRecipe('space', 'default').blobs.find((orb) => orb.hue === 0)!;
      const base = boostSaturation(colors.primary, ACCENT_VIVID_FACTOR);

      expect(tree).toContain(withAlpha(rotateHue(base, 0), dominant.peak));
    });

    it('is no longer the twin half-moons: no dome light', async () => {
      const tree = await treeOf();

      // The dome is a single tall gradient; the orbs are radial ones scaled into circles.
      expect(tree).not.toContain('RadialGradient","props":{"cx"');
    });
  });
});
