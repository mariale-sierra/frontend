import { render } from '@testing-library/react-native';
import { ChallengeDeckHalo } from '../challengeDeckHalo';
import { DECK_HALO_PEAK } from '../../../constants/challengeDeck';
import { activityColors } from '../../../constants/theme';
import { ACCENT_VIVID_FACTOR } from '../../ui/accentDome';
import { boostSaturation, withAlpha } from '../../../utils/color';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const COLORS = [activityColors.strength, activityColors.cardioLow, activityColors.mindBody];

async function renderHalo(progress: number, radius = 100) {
  return render(<ChallengeDeckHalo colors={COLORS} progress={{ value: progress } as never} radius={radius} />);
}

const tree = (screen: Awaited<ReturnType<typeof renderHalo>>) => JSON.stringify(screen.toJSON());
// How much of each disc shows, in the cards' order.
const opacities = (json: string) => [...json.matchAll(/"opacity":\{"value":([0-9.]+)\}/g)].map((match) => Number(match[1]));

describe('ChallengeDeckHalo', () => {
  it('is a circle as big as its radius says, and takes no touches', async () => {
    const screen = await renderHalo(0, 150);

    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
    expect(tree(screen)).toContain('"width":300,"height":300');
  });

  it('has a disc for every card, in that card’s own activity color', async () => {
    const json = tree(await renderHalo(0));

    expect(json.match(/skCircle/g)).toHaveLength(COLORS.length);
    for (const color of COLORS) {
      // The center of each disc is its color, made a touch more vivid like the dome light, at `DECK_HALO_PEAK`.
      expect(json).toContain(withAlpha(boostSaturation(color, ACCENT_VIVID_FACTOR), DECK_HALO_PEAK));
    }
  });

  it('fades each disc to nothing at the rim — no visible edge — and dithers it', async () => {
    const json = tree(await renderHalo(0));

    expect(json.match(/"dither":true/g)).toHaveLength(COLORS.length);
    // The last stop of every gradient is fully transparent.
    for (const color of COLORS) {
      expect(json).toContain(`${withAlpha(boostSaturation(color, ACCENT_VIVID_FACTOR), 0).toUpperCase()}"]`);
    }
  });

  it('shows only the front card’s disc when a card is in front', async () => {
    expect(opacities(tree(await renderHalo(0)))).toEqual([1, 0, 0]);
    expect(opacities(tree(await renderHalo(1)))).toEqual([0, 1, 0]);
    expect(opacities(tree(await renderHalo(2)))).toEqual([0, 0, 1]);
  });

  it('passes the light from one card’s color to the next’s while the deck is between them', async () => {
    const [first, second, third] = opacities(tree(await renderHalo(0.25)));

    expect(first).toBeCloseTo(0.75, 5);
    expect(second).toBeCloseTo(0.25, 5);
    expect(third).toBe(0);
  });
});
