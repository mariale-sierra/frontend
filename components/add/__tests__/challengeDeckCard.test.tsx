import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ChallengeDeckCard } from '../challengeDeckCard';
import { activityColors, colors, fillOpacity, radius, spacing } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import { DECK_CARD_PADDING } from '../../../constants/challengeDeck';
import { withAlpha } from '../../../utils/color';
import type { LogChallengeQuickPick } from '../../../services/adapters/metricsAdapter';

// The glow is drawn once the card has been measured; this hands it a size at once.
jest.mock('../../ui/accentGlow', () => ({
  AccentGlow: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 300, height: 340 }),
}));

const challenge = (overrides: Partial<LogChallengeQuickPick> = {}): LogChallengeQuickPick => ({
  id: 'challenge-1',
  name: 'Morning Strength',
  photoUrl: null,
  dominantActivityCategory: 'strength',
  ...overrides,
});

const render = (item: LogChallengeQuickPick) => renderWithTheme(<ChallengeDeckCard challenge={item} />);
const tree = (screen: Awaited<ReturnType<typeof render>>) => JSON.stringify(screen.toJSON());

describe('ChallengeDeckCard', () => {
  it('has the challenge title on top, in the challenge cards own off-white, fully opaque', async () => {
    const screen = await render(challenge());

    expect(screen.getByText('Morning Strength')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText('Morning Strength').props.style)).toMatchObject({
      color: colors.primary,
      opacity: 1,
    });
  });

  it('is the title and the photo — no progress bar, and no tick ring', async () => {
    const json = tree(await render(challenge({ photoUrl: 'https://example.com/today.jpg' })));

    expect(json.indexOf('https://example.com/today.jpg')).toBeGreaterThan(json.indexOf('Morning Strength'));
    // No "Day N / M" line or bar, no ring of ticks or number.
    expect(json).not.toContain('home.dayOf');
    expect(json).not.toContain('skPath');
  });

  it('shows the latest photo as the preview, taking the rest of the card', async () => {
    const screen = await render(challenge({ photoUrl: 'https://example.com/today.jpg' }));
    const json = tree(screen);

    expect(json).toContain('https://example.com/today.jpg');
    expect(json).toContain('"resizeMode":"cover"');
    expect(json).toContain('"flex":1,"borderRadius"');
  });

  it('holds a paper-tinted placeholder where there is no photo yet', async () => {
    const json = tree(await render(challenge({ photoUrl: null })));

    expect(json).toContain(`"backgroundColor":"${withAlpha(colors.paper, fillOpacity.placeholder)}"`);
    expect(json).toContain('image-outline');
  });

  it('gives the photo the small radius of a photo tile', async () => {
    const json = tree(await render(challenge({ photoUrl: 'https://example.com/today.jpg' })));

    expect(json).toContain(`"borderRadius":${radius.small}`);
  });

  it('is the dark challenge card, glowing in the challenge own activity color', async () => {
    const json = tree(await render(challenge({ dominantActivityCategory: 'cardioLow' })));

    expect(json).toContain(`"backgroundColor":"${colors.ink}"`);
    // The outline is the challenge's color, softened.
    expect(json).toContain(`"borderColor":"${withAlpha(activityColors.cardioLow, 0.3)}"`);
    expect(json).not.toContain(`"borderColor":"${withAlpha(activityColors.strength, 0.3)}"`);
  });

  it('takes the neutral color when the challenge has no dominant activity yet', async () => {
    const json = tree(await render(challenge({ dominantActivityCategory: null })));

    expect(json).toContain(`"borderColor":"${withAlpha(colors.primary, 0.3)}"`);
  });

  it('has a mesh gradient of its own — the `deck` recipe, not Mine’s, and not the plain half-moon glow', async () => {
    const recipe = getMeshRecipe('deck', 'cardioLow');
    const json = tree(await render(challenge({ dominantActivityCategory: 'cardioLow' })));

    // One dithered gradient per field of the recipe, and its scrim — where the plain glow has two.
    const gradients = recipe.blobs.length + 1 + (recipe.topFade ? 1 : 0);
    expect(json.match(/"dither":true/g)).toHaveLength(gradients);
    expect(gradients).toBeGreaterThan(2);
  });

  it('keeps its content well in from the edge of the card, all round', async () => {
    const screen = await render(challenge());
    const card = StyleSheet.flatten((screen.toJSON() as unknown as { props: { style: never } }).props.style) as {
      padding?: number;
    };

    // The inset the challenge cards give their text: `md` of padding and an `sm` on top.
    expect(card.padding).toBe(DECK_CARD_PADDING);
    expect(DECK_CARD_PADDING).toBe(spacing.md + spacing.sm);
  });

  describe('telling when its photo is done', () => {
    const PHOTO = 'https://example.com/today.jpg';
    const renderWith = (item: LogChallengeQuickPick, onPhotoSettled: () => void) =>
      renderWithTheme(<ChallengeDeckCard challenge={item} onPhotoSettled={onPhotoSettled} />);

    it('waits for its photo: nothing yet while it is still loading', async () => {
      const onPhotoSettled = jest.fn();
      await renderWith(challenge({ photoUrl: PHOTO }), onPhotoSettled);

      expect(onPhotoSettled).not.toHaveBeenCalled();
    });

    it('is done once its photo has loaded', async () => {
      const onPhotoSettled = jest.fn();
      const screen = await renderWith(challenge({ photoUrl: PHOTO }), onPhotoSettled);

      await fireEvent(screen.getByTestId('challenge-deck-photo'), 'load');

      expect(onPhotoSettled).toHaveBeenCalledTimes(1);
    });

    it('is done too when its photo fails to load: it goes without, not on waiting for it', async () => {
      const onPhotoSettled = jest.fn();
      const screen = await renderWith(challenge({ photoUrl: PHOTO }), onPhotoSettled);

      await fireEvent(screen.getByTestId('challenge-deck-photo'), 'error');

      expect(onPhotoSettled).toHaveBeenCalledTimes(1);
    });

    it('has nothing to wait for without a photo: done at once, on the placeholder', async () => {
      const onPhotoSettled = jest.fn();
      const screen = await renderWith(challenge({ photoUrl: null }), onPhotoSettled);

      expect(onPhotoSettled).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('challenge-deck-photo')).toBeNull();
    });

    it('does not need anyone listening', async () => {
      const screen = await render(challenge({ photoUrl: PHOTO }));

      await fireEvent(screen.getByTestId('challenge-deck-photo'), 'load');

      expect(screen.getByTestId('challenge-deck-photo')).toBeTruthy();
    });
  });
});
