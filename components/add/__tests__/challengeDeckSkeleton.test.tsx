import { StyleSheet } from 'react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ChallengeDeckSkeleton } from '../challengeDeckSkeleton';
import { ChallengeDeck } from '../challengeDeck';
import { DECK_VISIBLE_BEHIND } from '../../../constants/challengeDeck';
import { colors, fillOpacity, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { LogChallengeQuickPick } from '../../../services/adapters/metricsAdapter';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
// The glow is drawn once a card has been measured; this hands it a size at once.
jest.mock('../../ui/accentGlow', () => ({
  AccentGlow: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 300, height: 340 }),
}));

const styleOf = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, any>;
type Node = { props: { style?: unknown }; children: Node[] };

const render = (width = 342) => renderWithTheme(<ChallengeDeckSkeleton width={width} />);
// The boxes the cards sit in.
const boxes = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByTestId('challenge-deck-skeleton').children as unknown as Node[];

describe('ChallengeDeckSkeleton', () => {
  it('draws nothing before it has a width', async () => {
    const screen = await render(0);

    expect(screen.queryByTestId('challenge-deck-skeleton')).toBeNull();
  });

  it('is a pile of cards — the whole pile the deck shows, the front card and the ones behind it', async () => {
    const screen = await render();

    expect(boxes(screen)).toHaveLength(DECK_VISIBLE_BEHIND + 1);
  });

  it('is as plain as the app’s other skeletons: one flat gray block to a card, and nothing in it', async () => {
    const screen = await render();
    const json = JSON.stringify(screen.toJSON());
    const blocks = json.match(new RegExp(`"backgroundColor":"${withAlpha(colors.paper, fillOpacity.subtle)}"`, 'g')) ?? [];

    expect(blocks).toHaveLength(DECK_VISIBLE_BEHIND + 1);
    // No text lines, no photo block, no ring: nothing but the blocks and the shading over them.
    expect(json).not.toContain('"Text"');
    expect(json).not.toContain('borderWidth');
    // Each block has the big radius of the cards.
    expect(json.match(new RegExp(`"borderRadius":${radius.big}`, 'g'))?.length).toBeGreaterThanOrEqual(DECK_VISIBLE_BEHIND + 1);
  });

  it('is not a spinner', async () => {
    const screen = await render();

    expect(JSON.stringify(screen.toJSON())).not.toContain('ActivityIndicator');
  });

  it('is the pile of a deck of three, the same size and in the same places — so the cards fill in where they are', async () => {
    const skeleton = await render();
    const challenges: LogChallengeQuickPick[] = ['A', 'B', 'C'].map((name) => ({
      id: name,
      name,
      photoUrl: null,
      dominantActivityCategory: 'strength',
    }));
    const deck = await renderWithTheme(<ChallengeDeck challenges={challenges} width={342} onSelect={jest.fn()} />);
    const deckBoxes = (deck.getByTestId('challenge-deck').children[1] as unknown as Node).children;

    boxes(skeleton).forEach((box, index) => {
      const skeletonStyle = styleOf(box);
      const deckStyle = styleOf(deckBoxes[index]);

      for (const key of ['width', 'height', 'left', 'top', 'zIndex', 'opacity']) {
        expect(skeletonStyle[key]).toEqual(deckStyle[key]);
      }
      expect(JSON.stringify(skeletonStyle.transform)).toBe(JSON.stringify(deckStyle.transform));
    });
  });

  it('takes no touches: nothing to press yet', async () => {
    const screen = await render();

    for (const box of boxes(screen)) {
      expect((box.props as { pointerEvents?: string }).pointerEvents).toBe('none');
    }
  });
});
