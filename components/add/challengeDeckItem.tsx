import { StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { colors, radius } from '../../constants/theme';
import { deckCardMotion, deckTransform } from '../../utils/challengeDeck';

interface DeckItemProps {
  index: number;
  /** How many cards the deck has: earlier cards are in front of later ones. */
  count: number;
  /** Which card is in front, continuously: 1.5 is half way from the second to the third. */
  progress: SharedValue<number>;
  width: number;
  height: number;
  left: number;
  /** Only the front card takes touches — the ones behind only show their edge. */
  isFront: boolean;
  children: ReactNode;
}

/**
 * The place a card of the deck sits in, and the motion it has there: held at the top of
 * the deck and moved by `deckCardMotion` of its distance from the front — its tilt, its
 * step down the diagonal, its shading — from the deck's `progress`. The real deck's cards
 * and its loading skeleton's are both put in one (the skeleton with a `progress` that
 * never moves), so they are the same pile.
 */
export function DeckItem({ index, count, progress, width, height, left, isFront, children }: DeckItemProps) {
  const motion = useAnimatedStyle(() => {
    const card = deckCardMotion(index - progress.value, width, height);
    return { opacity: card.opacity, transform: deckTransform(card) };
  });
  // The cards behind are darker, an `ink` over them that clears as they come forward.
  const shade = useAnimatedStyle(() => ({ opacity: deckCardMotion(index - progress.value, width, height).shade }));

  return (
    <Animated.View
      pointerEvents={isFront ? 'auto' : 'none'}
      // Earlier cards are in front of later ones.
      style={[styles.item, { width, height, left, zIndex: count - index }, motion]}
    >
      {children}
      <Animated.View pointerEvents="none" style={[styles.shade, shade]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Held at the top of the deck; `deckCardMotion` moves it from there.
  item: {
    position: 'absolute',
    top: 0,
  },
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.ink,
    borderRadius: radius.big,
  },
});
