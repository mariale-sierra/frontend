import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../ui/text';
import { ChallengeDeckCard } from './challengeDeckCard';
import { ChallengeDeckHalo } from './challengeDeckHalo';
import { DeckItem } from './challengeDeckItem';
import { DECK_SPRING } from '../../constants/challengeDeck';
import { spacing } from '../../constants/theme';
import { deckDragProgress, deckSettleTarget, getDeckLayout } from '../../utils/challengeDeck';
import { triggerLightHaptic } from '../../utils/haptics';
import { getChallengeGlowColor } from '../../services/adapters/challengeState';
import type { LogChallengeQuickPick } from '../../services/adapters/metricsAdapter';

interface ChallengeDeckProps {
  challenges: LogChallengeQuickPick[];
  /** The width the deck has, measured by whatever holds it — the same one, kept across
   * the loading skeleton and the deck that replaces it, so the deck is there the moment
   * it arrives. Nothing is drawn while it is 0 (before the first layout). */
  width: number;
  /** Called with the id of the challenge whose card is pressed. */
  onSelect: (challengeId: string) => void;
}

interface DeckCardButtonProps {
  challenge: LogChallengeQuickPick;
  /** For a screen reader, which can reach any card. A touch on the front card is the
   * deck's own tap gesture, not this. */
  onSelect: (challengeId: string) => void;
}

function DeckCardButton({ challenge, onSelect }: DeckCardButtonProps) {
  const { t } = useTranslation();

  // Not a `Pressable`: its press would still fire when a drag lets go, since the drag is
  // a native gesture the touch system knows nothing about.
  return (
    <View
      style={styles.fill}
      accessible
      accessibilityRole="button"
      accessibilityLabel={t('home.logProgressA11y', { name: challenge.name })}
      onAccessibilityTap={() => onSelect(challenge.id)}
    >
      <ChallengeDeckCard challenge={challenge} />
    </View>
  );
}

/**
 * The log picker's challenges as a deck of cards, not a list: piled one behind
 * another and tilted in 3D, so the pile runs down a diagonal — the front card whole,
 * the ones behind it a little smaller and darker with their edges showing — and dragging
 * up throws the front card up and to the left (turning as it goes) while the next
 * comes forward, and dragging down brings it back the way it went; the deck settles
 * on a card, a flick carrying it on to the next. One drag moves one card. The cards are
 * little squares, a bit tall (`DECK_CARD_ASPECT`), `DECK_CARD_WIDTH_SHARE` of the deck's
 * width. Whether there are one, two or ten of them, the pile is centered
 * (`getDeckLayout`).
 *
 * Nothing scrolls: a pan gesture moves one number, `progress` (which card is in
 * front, between cards while dragging), and every card's place and look is
 * `deckCardMotion` of its distance from it, on the UI thread. (Not a `ScrollView`,
 * which would cut a card off at its edge as it rose out of the deck.) A TAP is a
 * gesture of the same detector, raced against the pan — whichever the finger's
 * movement decides on first wins — so a drag never counts as a press, and a press
 * never as a drag: it opens the front card if the touch was on it. Behind the pile is a
 * circle of light in the front card's activity color (`ChallengeDeckHalo`).
 */
export function ChallengeDeck({ challenges, width, onSelect }: ChallengeDeckProps) {
  const [front, setFront] = useState(0);
  // The same number for the tap gesture to read, which runs outside a render.
  const frontRef = useRef(0);
  const progress = useSharedValue(0);
  const dragOrigin = useSharedValue(0);
  const lastFront = useSharedValue(0);

  const count = challenges.length;
  const { cardWidth, cardHeight, cardLeft, viewportHeight, step, haloRadius } = getDeckLayout(width, count);

  // The circle of light behind the deck: each card's own activity color.
  const haloColors = useMemo(
    () => challenges.map((challenge) => getChallengeGlowColor('active', challenge.dominantActivityCategory)),
    [challenges],
  );

  const commitFront = useCallback((index: number) => {
    frontRef.current = index;
    setFront(index);
  }, []);

  const selectFront = useCallback(() => {
    const challenge = challenges[frontRef.current];
    if (challenge) onSelect(challenge.id);
  }, [challenges, onSelect]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .withTestId('challenge-deck-pan')
        .activeOffsetY([-10, 10])
        .failOffsetX([-10, 10])
        .onBegin(() => {
          dragOrigin.value = progress.value;
          lastFront.value = Math.round(progress.value);
        })
        .onUpdate((event) => {
          if (step <= 0) {
            return;
          }
          const dragged = deckDragProgress(dragOrigin.value, event.translationY, step, count);
          progress.value = dragged;
          const nearest = Math.round(dragged);
          if (nearest !== lastFront.value) {
            lastFront.value = nearest;
            runOnJS(commitFront)(nearest);
            runOnJS(triggerLightHaptic)();
          }
        })
        .onEnd((event) => {
          if (step <= 0) {
            return;
          }
          const target = deckSettleTarget(progress.value, event.velocityY, step, count, Math.round(dragOrigin.value));
          progress.value = withSpring(target, DECK_SPRING);
          if (target !== lastFront.value) {
            lastFront.value = target;
            runOnJS(commitFront)(target);
            runOnJS(triggerLightHaptic)();
          }
        }),
    [commitFront, count, dragOrigin, lastFront, progress, step],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .withTestId('challenge-deck-tap')
        .maxDistance(10)
        .onEnd((event, success) => {
          if (!success) {
            return;
          }
          // Only a touch on the front card opens it — not the edges of the ones behind.
          const onCard =
            event.x >= cardLeft && event.x <= cardLeft + cardWidth && event.y >= 0 && event.y <= cardHeight;
          if (onCard) {
            runOnJS(selectFront)();
          }
        }),
    [cardHeight, cardLeft, cardWidth, selectFront],
  );

  const gesture = useMemo(() => Gesture.Race(pan, tap), [pan, tap]);

  return (
    <View testID="challenge-deck">
      {width > 0 ? (
        <>
          {/* Drawn first, so it is behind everything after it by the order of the tree
              alone — with no z-index of its own to sort against the tilted cards. */}
          <ChallengeDeckHalo
            colors={haloColors}
            progress={progress}
            radius={haloRadius}
            style={{ left: width / 2 - haloRadius, top: viewportHeight / 2 - haloRadius }}
          />

          <GestureDetector gesture={gesture}>
            <View style={{ height: viewportHeight }}>
              {challenges.map((challenge, index) => (
                <DeckItem
                  key={challenge.id}
                  index={index}
                  count={count}
                  progress={progress}
                  width={cardWidth}
                  height={cardHeight}
                  left={cardLeft}
                  isFront={index === front}
                >
                  <DeckCardButton challenge={challenge} onSelect={onSelect} />
                </DeckItem>
              ))}
            </View>
          </GestureDetector>

          {count > 1 ? (
            <Text variant="caption" tone="secondary" align="center" style={styles.counter}>
              {front + 1} / {count}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  counter: {
    marginTop: spacing.md,
  },
});
