import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Path } from '@shopify/react-native-skia';
import { spacing, textOpacity } from '../../../constants/theme';
import { PROGRESS_RING } from '../../../constants/progressRing';
import { buildTickRingPath } from '../../../utils/tickRing';
import { withAlpha } from '../../../utils/color';
import { WebSafeCanvas } from '../../ui/webSafeCanvas';

const RING_SIZE = 104;

// The ticks are the Progress screen's ring scaled down — its own tick length,
// width and inset (`PROGRESS_RING`), times the ratio of the two ring sizes — so
// the card's ring is a small copy of it: short, thick, rounded ticks, not long
// thin spikes.
const SCALE = RING_SIZE / PROGRESS_RING.size;
// The ticks are a little thicker than the Progress ring's scaled width (2026-09-20,
// explicit request: 'a bit thicker'): a tick a third again as wide is still well apart
// from its neighbors at this size.
const TICK_THICKNESS = 1.5;
const TICK_LENGTH = PROGRESS_RING.tickLength * SCALE;
const TICK_WIDTH = PROGRESS_RING.tickWidth * SCALE * TICK_THICKNESS;
const TICK_INSET = PROGRESS_RING.tickInset * SCALE;

// Fewer ticks than the Progress ring's 60 (`PROGRESS_RING.segmentCount`): shrunk
// to 104px, the same 60 sit about 5px apart (the Progress ring's are about 8px
// apart) and looked overcrowded. 36 is one every 10 degrees, about 8px apart
// again — the same spacing as the Progress ring.
const TICK_COUNT = 36;

// The ticks are the accent color, softened — full strength was harsh for a ring
// that only decorates (the Progress ring has a dim track between its bright ticks).
const TICK_OPACITY = textOpacity.secondary;

interface ChallengeCardTickRingProps {
  /** The challenge's own activity color, for the ticks. */
  accentColor: string;
  /** What sits in the middle of the ring (a number and a caption). */
  children?: ReactNode;
  /** Nudges the ring down from its default vertical center, in px — e.g.
   * Explore's glow card, so the ring sits clear of the member-count badge
   * pinned to the card's top-right corner above it. A direct `top` offset on
   * the ring itself (not padding/margin, which a `justifyContent: 'center'`
   * column only applies half of to the visible position) — unset is the
   * original exact-center placement. */
  topOffset?: number;
}

/**
 * A ring of soft accent ticks with content in its middle — the Explore card's
 * side panel, a small copy of the tick ring on the challenge's Progress screen.
 * Just the ticks, as one rounded-stroke path in a small fixed-size Skia canvas:
 * the middle is left clear, with no face or glow of its own, so the card's own
 * gradient runs unbroken behind the number and the card reads as one piece (an
 * opaque disc with its own glow there looked like a second gradient on the card).
 * Centered in a column a little wider than the ring itself.
 */
export function ChallengeCardTickRing({ accentColor, children, topOffset }: ChallengeCardTickRingProps) {
  const center = RING_SIZE / 2;
  // A round stroke cap reaches half a tick width past each end of its line, so the
  // lines are pulled in by that much to keep the ticks the Progress ring's size.
  const ticks = buildTickRingPath({
    center,
    innerRadius: center - TICK_INSET - TICK_LENGTH + TICK_WIDTH / 2,
    outerRadius: center - TICK_INSET - TICK_WIDTH / 2,
    count: TICK_COUNT,
  });

  return (
    <View style={styles.column}>
      <View style={[styles.ring, topOffset ? { top: topOffset } : null]}>
        <WebSafeCanvas style={StyleSheet.absoluteFill}>
          <Path
            path={ticks}
            style="stroke"
            strokeWidth={TICK_WIDTH}
            strokeCap="round"
            color={withAlpha(accentColor, TICK_OPACITY)}
          />
        </WebSafeCanvas>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: RING_SIZE + spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
