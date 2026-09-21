import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Skeleton } from '../ui/skeleton';
import { DeckItem } from './challengeDeckItem';
import { DECK_VISIBLE_BEHIND } from '../../constants/challengeDeck';
import { radius } from '../../constants/theme';
import { getDeckLayout } from '../../utils/challengeDeck';

// The whole pile the deck shows: the front card and the ones behind it.
const SKELETON_CARDS = DECK_VISIBLE_BEHIND + 1;

interface ChallengeDeckSkeletonProps {
  /** The width the deck will have (see `ChallengeDeck`). Nothing is drawn while it is 0. */
  width: number;
}

/**
 * What the log picker shows while its challenges load, in place of a spinner: the deck
 * as a pile of plain gray cards, like the app's other skeletons (one flat block a card,
 * no detail) — but in the same size, tilt, steps down the diagonal and shading as the
 * real ones (it puts them in the same `DeckItem`s, at rest, and lays them out with the
 * same `getDeckLayout`), so the deck that replaces it is where it was.
 */
export function ChallengeDeckSkeleton({ width }: ChallengeDeckSkeletonProps) {
  // The front card is the first: nothing to drag.
  const progress = useSharedValue(0);
  const { cardWidth, cardHeight, cardLeft, viewportHeight } = getDeckLayout(width, SKELETON_CARDS);

  if (width <= 0) {
    return null;
  }

  return (
    <View testID="challenge-deck-skeleton" style={{ height: viewportHeight }}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <DeckItem
          key={index}
          index={index}
          count={SKELETON_CARDS}
          progress={progress}
          width={cardWidth}
          height={cardHeight}
          left={cardLeft}
          isFront={false}
        >
          <Skeleton radius={radius.big} style={styles.card} />
        </DeckItem>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // One block, as big as its card.
  card: {
    flex: 1,
  },
});
