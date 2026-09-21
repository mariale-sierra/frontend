import 'react-native-gesture-handler/jestSetup';
import { StyleSheet } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ChallengeDeck } from '../challengeDeck';
import {
  DECK_CARD_ASPECT,
  DECK_CARD_WIDTH_SHARE,
  DECK_CASCADE,
  DECK_HALO_RADIUS_SHARE,
  DECK_IMAGES_TIMEOUT_MS,
  DECK_SHADE_STEP,
  DECK_STEP_SHARE,
  DECK_TILT,
  DECK_VISIBLE_BEHIND,
} from '../../../constants/challengeDeck';
import type { LogChallengeQuickPick } from '../../../services/adapters/metricsAdapter';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// The mock's `withSpring` does not land anywhere, and its `useSharedValue` makes a new
// value on every render (a real one is stable); these two are the real behavior.
jest.mock('react-native-reanimated', () => {
  const { useRef } = require('react');
  return {
    ...require('react-native-reanimated/mock'),
    withSpring: (toValue: number) => toValue,
    useSharedValue: (initial: number) => useRef({ value: initial }).current,
  };
});
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { name?: string }) => (values?.name ? `${key}:${values.name}` : key),
  }),
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

const NAMES = ['Morning Strength', 'Evening Run', 'Weekend Yoga', 'Mobility'];
const challenges: LogChallengeQuickPick[] = NAMES.map((name, index) => ({
  id: `challenge-${index}`,
  name,
  photoUrl: null,
  dominantActivityCategory: 'strength',
}));

// The deck sizes itself to the width it is given (its holder measures it).
async function renderDeck(items = challenges, onSelect = jest.fn(), width = 342) {
  return renderWithTheme(<ChallengeDeck challenges={items} width={width} onSelect={onSelect} />);
}

// The animated box a card sits in: the card's button, then its parent.
const boxOf = (screen: Awaited<ReturnType<typeof renderDeck>>, name: string) =>
  screen.getByLabelText(`home.logProgressA11y:${name}`).parent!;
const styleOf = (box: { props: { style?: unknown } }) => StyleSheet.flatten(box.props.style as never) as Record<string, any>;

describe('ChallengeDeck', () => {
  it('shows nothing until it knows how wide it is', async () => {
    const screen = await renderDeck(challenges, jest.fn(), 0);

    expect(screen.queryByText('Morning Strength')).toBeNull();
  });

  it('holds a card for every challenge, in one pile', async () => {
    const screen = await renderDeck();

    for (const name of NAMES) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('makes the cards little squares, a bit tall — a share of the deck, the front card centered', async () => {
    const screen = await renderDeck();
    const { width, height, left } = styleOf(boxOf(screen, 'Morning Strength'));

    expect(width).toBeCloseTo(342 * DECK_CARD_WIDTH_SHARE, 5);
    expect(width).toBeLessThan(342);
    expect(height / width).toBeCloseTo(DECK_CARD_ASPECT, 5);
    // The front card is centered, and the ones standing out to its right still fit.
    expect(left).toBeCloseTo((342 - width) / 2, 5);
    expect(left + width + DECK_CASCADE * DECK_VISIBLE_BEHIND).toBeLessThanOrEqual(342);
  });

  it('tilts every card in 3D, on a diagonal, and puts the perspective first', async () => {
    const screen = await renderDeck();

    for (const name of NAMES) {
      const transform = styleOf(boxOf(screen, name)).transform as Record<string, unknown>[];
      const keys = transform.map((entry) => Object.keys(entry)[0]);
      const angle = (key: string) => parseFloat(String(transform.find((entry) => key in entry)![key]));

      expect(keys[0]).toBe('perspective');
      expect(angle('rotateX')).toBe(DECK_TILT.x);
      expect(angle('rotateY')).toBe(DECK_TILT.y);
      expect(angle('rotateZ')).toBe(DECK_TILT.z);
    }
  });

  it('steps the cards behind down and to the right of the one in front, so the pile runs down a diagonal', async () => {
    const screen = await renderDeck();
    const move = (name: string) => {
      const transform = styleOf(boxOf(screen, name)).transform as Record<string, number>[];
      return {
        x: transform.find((entry) => 'translateX' in entry)!.translateX,
        y: transform.find((entry) => 'translateY' in entry)!.translateY,
      };
    };

    expect(move('Morning Strength')).toEqual({ x: 0, y: 0 });
    expect(move('Evening Run').x).toBeGreaterThan(0);
    expect(move('Evening Run').y).toBeGreaterThan(0);
    expect(move('Weekend Yoga').x).toBeGreaterThan(move('Evening Run').x);
    expect(move('Weekend Yoga').y).toBeGreaterThan(move('Evening Run').y);
  });

  it('darkens each card behind the front one, more the further back', async () => {
    const screen = await renderDeck();
    // The `ink` laid over a card, after its box: the box's last child.
    const shadeOf = (name: string) => {
      const box = boxOf(screen, name);
      const overlay = box.children[box.children.length - 1] as unknown as { props: { style: unknown } };
      return StyleSheet.flatten(overlay.props.style as never).opacity as number;
    };

    expect(shadeOf('Morning Strength')).toBe(0);
    expect(shadeOf('Evening Run')).toBeCloseTo(DECK_SHADE_STEP, 5);
    expect(shadeOf('Weekend Yoga')).toBeGreaterThan(shadeOf('Evening Run'));
  });

  describe('the circle of light behind', () => {
    // How much of each card's disc shows, in the cards' order.
    const halo = (screen: Awaited<ReturnType<typeof renderDeck>>) =>
      [...JSON.stringify(screen.toJSON()).matchAll(/"opacity":\{"value":([0-9.]+)\}/g)].map((match) => Number(match[1]));

    it('has a disc for every card behind them, under the cards', async () => {
      const screen = await renderDeck();
      const json = JSON.stringify(screen.toJSON());

      expect(json.match(/skCircle/g)?.length).toBeGreaterThanOrEqual(NAMES.length);
      // Behind the cards: it comes before the first of them in the tree.
      expect(json.indexOf('skCircle')).toBeLessThan(json.indexOf('Morning Strength'));
    });

    it('shows the light of the card in front, and only that', async () => {
      const screen = await renderDeck();

      expect(halo(screen)).toEqual([1, 0, 0, 0]);
    });

    it('moves on to the next card’s light when the deck moves on', async () => {
      const screen = await renderDeck();

      await act(async () => {
        fireGestureHandler(getByGestureTestId('challenge-deck-pan'), [
          { state: State.BEGAN },
          { state: State.ACTIVE },
          { translationY: -100 },
          { translationY: -160 },
          { state: State.END, translationY: -160, velocityY: 0 },
        ]);
      });

      expect(halo(screen)).toEqual([0, 1, 0, 0]);
    });
  });

  describe('however many cards there are', () => {
    // n challenges, named after their place.
    const some = (n: number): LogChallengeQuickPick[] =>
      Array.from({ length: n }, (_, index) => ({ ...challenges[0], id: `c-${index}`, name: `Challenge ${index}` }));
    const deckChildren = (screen: Awaited<ReturnType<typeof renderDeck>>) =>
      screen.getByTestId('challenge-deck').children as unknown as { props: { style: unknown } }[];

    it.each([1, 2, 3, 4, 8])('centers the front card in the deck for %s challenge(s)', async (n) => {
      const screen = await renderDeck(some(n));
      const { left, width } = styleOf(boxOf(screen, 'Challenge 0'));

      // As much room to the left of the card as to its right, whatever stands out behind it.
      expect(left).toBeCloseTo(342 - (left + width), 5);
      expect(left + width + DECK_CASCADE * Math.min(n - 1, DECK_VISIBLE_BEHIND)).toBeLessThanOrEqual(342);
    });

    it('keeps the front card where it is as the deck moves on, and as fewer cards are left behind it', async () => {
      const screen = await renderDeck(some(3));
      const front = () => styleOf(boxOf(screen, 'Challenge 0')).left;
      const before = front();

      await act(async () => {
        fireGestureHandler(getByGestureTestId('challenge-deck-pan'), [
          { state: State.BEGAN },
          { state: State.ACTIVE },
          { translationY: -160 },
          { state: State.END, translationY: -160, velocityY: 0 },
        ]);
      });

      expect(front()).toBe(before);
    });

    it('is one card, centered, for a single challenge: nothing standing out to the right, and no count', async () => {
      const screen = await renderDeck(some(1));
      const { left, width } = styleOf(boxOf(screen, 'Challenge 0'));

      expect(left).toBeCloseTo((342 - width) / 2, 5);
      expect(screen.queryByText(/^\d+ \/ \d+$/)).toBeNull();
    });

    it('leaves room for one card behind, not two, for two challenges', async () => {
      const viewportHeight = async (n: number) => {
        const screen = await renderDeck(some(n));
        return styleOf(deckChildren(screen)[1]).height as number;
      };

      expect(await viewportHeight(1)).toBeLessThan(await viewportHeight(2));
      expect(await viewportHeight(2)).toBeLessThan(await viewportHeight(3));
      // Three cards already show all the pile there is.
      expect(await viewportHeight(3)).toBe(await viewportHeight(9));
    });

    it.each([1, 2, 3, 6])('centers the circle of light on the front card for %s challenge(s)', async (n) => {
      const screen = await renderDeck(some(n));
      const [halo, viewport] = deckChildren(screen).map((child) => styleOf(child));
      const radius = halo.width / 2;

      // Centered on the front card, in width and in height.
      expect(halo.left + radius).toBeCloseTo(342 / 2, 5);
      expect(halo.top + radius).toBeCloseTo(styleOf(boxOf(screen, 'Challenge 0')).height / 2, 5);
      expect(viewport.height).toBeGreaterThan(0);
      expect(radius).toBeCloseTo(342 * DECK_CARD_WIDTH_SHARE * DECK_HALO_RADIUS_SHARE, 5);
    });

    it('draws the circle of light before the cards, with no z-index — behind them by the order of the tree', async () => {
      const screen = await renderDeck(some(3));
      const [halo, viewport] = deckChildren(screen).map((child) => styleOf(child));

      expect(halo.zIndex).toBeUndefined();
      expect(viewport.height).toBeGreaterThan(0);
      // Each card has a z-index among the others.
      expect(styleOf(boxOf(screen, 'Challenge 0')).zIndex).toBeGreaterThan(0);
    });
  });

  it('piles the first card on top: each one behind is under the one before', async () => {
    const screen = await renderDeck();
    const zIndexes = NAMES.map((name) => styleOf(boxOf(screen, name)).zIndex);

    expect([...zIndexes].sort((a, b) => b - a)).toEqual(zIndexes);
    expect(new Set(zIndexes).size).toBe(NAMES.length);
  });

  it('shows the front card whole and the ones behind it smaller — the last of them not at all', async () => {
    const screen = await renderDeck();
    const scaleOf = (name: string) => styleOf(boxOf(screen, name)).transform.find((entry: any) => 'scale' in entry).scale;
    const opacityOf = (name: string) => styleOf(boxOf(screen, name)).opacity;

    expect(scaleOf('Morning Strength')).toBe(1);
    expect(scaleOf('Evening Run')).toBeLessThan(1);
    expect(scaleOf('Weekend Yoga')).toBeLessThan(scaleOf('Evening Run'));
    expect(opacityOf('Weekend Yoga')).toBe(1);
    expect(opacityOf('Mobility')).toBe(0);
  });

  describe('touch', () => {
    const CARD_WIDTH = 342 * DECK_CARD_WIDTH_SHARE;
    const CARD_HEIGHT = CARD_WIDTH * DECK_CARD_ASPECT;
    const STEP = CARD_HEIGHT * DECK_STEP_SHARE;
    const CENTER_X = 342 / 2;

    const tapAt = (x: number, y: number) =>
      fireGestureHandler(getByGestureTestId('challenge-deck-tap'), [
        { state: State.BEGAN, x, y },
        { state: State.ACTIVE, x, y },
        { state: State.END, x, y },
      ]);

    // The deck's state changes as the gesture goes, so it runs inside `act`.
    const drag = (translationY: number, velocityY = 0) =>
      act(async () => {
        fireGestureHandler(getByGestureTestId('challenge-deck-pan'), [
          { state: State.BEGAN },
          { state: State.ACTIVE },
          { translationY: translationY / 2 },
          { translationY },
          { state: State.END, translationY, velocityY },
        ]);
      });

    it('opens the front card when it is tapped', async () => {
      const onSelect = jest.fn();
      await renderDeck(challenges, onSelect);

      tapAt(CENTER_X, CARD_HEIGHT / 2);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('challenge-0');
    });

    it('does not open anything for a tap on the slivers of the cards behind, or beside the card', async () => {
      const onSelect = jest.fn();
      await renderDeck(challenges, onSelect);

      tapAt(CENTER_X, CARD_HEIGHT + 8);
      tapAt(4, CARD_HEIGHT / 2);
      tapAt(342 - 4, CARD_HEIGHT / 2);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('brings the next card forward when dragged up — and a drag is not a press', async () => {
      const onSelect = jest.fn();
      const screen = await renderDeck(challenges, onSelect);

      await drag(-STEP - 4);

      expect(screen.getByText('2 / 4')).toBeTruthy();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('moves ONE card to a drag, however long: a drag of several steps brings only the next card', async () => {
      const screen = await renderDeck();

      await drag(-STEP * 4);

      expect(screen.getByText('2 / 4')).toBeTruthy();
    });

    it('moves ONE card to a flick, however hard', async () => {
      const screen = await renderDeck();

      await drag(-STEP * 0.4, -9000);

      expect(screen.getByText('2 / 4')).toBeTruthy();
    });

    it('brings the last one back when dragged down, and stays on the first at the top of the pile', async () => {
      const screen = await renderDeck();

      await drag(STEP * 3);
      expect(screen.getByText('1 / 4')).toBeTruthy();

      await drag(-STEP - 4);
      await drag(-STEP - 4);
      expect(screen.getByText('3 / 4')).toBeTruthy();

      await drag(STEP + 4);
      expect(screen.getByText('2 / 4')).toBeTruthy();
    });

    it('goes on to the next card from a short drag when let go at speed — a flick', async () => {
      const screen = await renderDeck();

      await drag(-STEP * 0.3, -800);

      expect(screen.getByText('2 / 4')).toBeTruthy();
    });

    it('settles back on the card when a short drag is let go slowly', async () => {
      const screen = await renderDeck();

      await drag(-STEP * 0.3, 0);

      expect(screen.getByText('1 / 4')).toBeTruthy();
    });

    it('opens the card that is in front after the deck has moved, not the first', async () => {
      const onSelect = jest.fn();
      await renderDeck(challenges, onSelect);

      await drag(-STEP - 4);
      await act(async () => tapAt(CENTER_X, CARD_HEIGHT / 2));

      expect(onSelect).toHaveBeenCalledWith('challenge-1');
    });

    it('lets a screen reader reach and open any card by its label', async () => {
      const onSelect = jest.fn();
      const screen = await renderDeck(challenges, onSelect);

      await fireEvent(screen.getByLabelText('home.logProgressA11y:Weekend Yoga'), 'accessibilityTap');

      expect(onSelect).toHaveBeenCalledWith('challenge-2');
    });
  });

  it('says which card it is on, out of how many', async () => {
    const screen = await renderDeck();

    expect(screen.getByText('1 / 4')).toBeTruthy();
  });

  it('is just the card, with no count, when there is only one challenge', async () => {
    const screen = await renderDeck([challenges[0]]);

    expect(screen.getByText('Morning Strength')).toBeTruthy();
    expect(screen.queryByText(/^\d+ \/ \d+$/)).toBeNull();
  });

  describe('telling when it is ready — every card\'s photo done', () => {
    const withPhotos = (count: number): LogChallengeQuickPick[] =>
      challenges.slice(0, count).map((challenge, index) => ({ ...challenge, photoUrl: `https://example.com/${index}.jpg` }));
    const renderReady = (items: LogChallengeQuickPick[], onReady: () => void) =>
      renderWithTheme(<ChallengeDeck challenges={items} width={342} onSelect={jest.fn()} onReady={onReady} />);

    afterEach(() => jest.useRealTimers());

    it('draws every card from the start, so their photos load', async () => {
      const screen = await renderReady(withPhotos(3), jest.fn());

      expect(screen.getAllByTestId('challenge-deck-photo')).toHaveLength(3);
    });

    it('is not ready while a photo is still loading', async () => {
      const onReady = jest.fn();
      const screen = await renderReady(withPhotos(3), onReady);
      const photos = screen.getAllByTestId('challenge-deck-photo');

      await fireEvent(photos[0], 'load');
      await fireEvent(photos[2], 'load');

      expect(onReady).not.toHaveBeenCalled();
    });

    it('is ready, once, when the last photo has loaded', async () => {
      const onReady = jest.fn();
      const screen = await renderReady(withPhotos(3), onReady);

      for (const photo of screen.getAllByTestId('challenge-deck-photo')) {
        await fireEvent(photo, 'load');
      }

      expect(onReady).toHaveBeenCalledTimes(1);
    });

    it('counts a photo that failed as done: it does not hold the deck up', async () => {
      const onReady = jest.fn();
      const screen = await renderReady(withPhotos(2), onReady);
      const [first, second] = screen.getAllByTestId('challenge-deck-photo');

      await fireEvent(first, 'load');
      await fireEvent(second, 'error');

      expect(onReady).toHaveBeenCalledTimes(1);
    });

    it('is ready at once when no card has a photo', async () => {
      const onReady = jest.fn();
      await renderReady(challenges, onReady);

      expect(onReady).toHaveBeenCalledTimes(1);
    });

    it('waits only for the photos there are: a card with none does not hold it up', async () => {
      const onReady = jest.fn();
      const mixed = [withPhotos(1)[0], challenges[1]];
      const screen = await renderReady(mixed, onReady);
      expect(onReady).not.toHaveBeenCalled();

      await fireEvent(screen.getByTestId('challenge-deck-photo'), 'load');

      expect(onReady).toHaveBeenCalledTimes(1);
    });

    it('gives up on a photo that never comes, after DECK_IMAGES_TIMEOUT_MS, so the deck is not held up for good', async () => {
      jest.useFakeTimers();
      const onReady = jest.fn();
      const screen = await renderReady(withPhotos(2), onReady);
      await fireEvent(screen.getAllByTestId('challenge-deck-photo')[0], 'load');

      await act(async () => jest.advanceTimersByTime(DECK_IMAGES_TIMEOUT_MS - 1));
      expect(onReady).not.toHaveBeenCalled();

      await act(async () => jest.advanceTimersByTime(1));
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    it('does not need anyone listening', async () => {
      const screen = await renderWithTheme(<ChallengeDeck challenges={withPhotos(1)} width={342} onSelect={jest.fn()} />);

      await fireEvent(screen.getByTestId('challenge-deck-photo'), 'load');

      expect(screen.getByTestId('challenge-deck')).toBeTruthy();
    });
  });
});
