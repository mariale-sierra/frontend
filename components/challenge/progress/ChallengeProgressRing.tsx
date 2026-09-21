import { StyleSheet, View } from 'react-native';
import { PROGRESS_RING } from '../../../constants/progressRing';

// The ring's geometry is shared (see `PROGRESS_RING`) with the Explore card's
// small echo of it.
const RING_SIZE = PROGRESS_RING.size;
const TICK_LENGTH = PROGRESS_RING.tickLength;
const TICK_WIDTH = PROGRESS_RING.tickWidth;
const TICK_INSET = PROGRESS_RING.tickInset;

interface ChallengeProgressRingProps {
  /** One resolved color per day, evenly spaced clockwise from 12 o'clock — the caller
   * (via utils/challengeCycle.ts's classifyDay) decides what each day's color is. */
  ticks: string[];
  children?: React.ReactNode;
}

/**
 * Pure-View "activity ring" — no SVG/Skia dependency (deliberately: this app
 * has no SVG lib installed, and @shopify/react-native-skia is a declared but
 * never-actually-used dependency, so its native linking status in the
 * current dev build is unverified — using it for a first time here risked
 * repeating the tabBarStyle-style "looks fine in code, breaks on device"
 * class of bug). Renders one small rounded tick per challenge day instead of
 * a smooth conic-gradient arc: each tick is a `RING_SIZE`-square wrapper
 * rotated around its own center (which coincides with the ring's center)
 * with the actual tick mark pinned to the wrapper's top edge — the same
 * "clock hand" technique used for any RN rotated-marker layout, so the only
 * geometry is a single rotation per tick, nothing that depends on getting a
 * clip+rotate combination exactly right.
 */
export function ChallengeProgressRing({ ticks, children }: ChallengeProgressRingProps) {
  const count = ticks.length;

  return (
    <View style={styles.ring}>
      {ticks.map((color, index) => {
        const angle = count > 0 ? (index / count) * 360 : 0;
        return (
          <View key={index} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${angle}deg` }] }]}>
            <View style={[styles.tick, { backgroundColor: color }]} />
          </View>
        );
      })}

      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
  },
  tick: {
    position: 'absolute',
    top: TICK_INSET,
    left: (RING_SIZE - TICK_WIDTH) / 2,
    width: TICK_WIDTH,
    height: TICK_LENGTH,
    borderRadius: TICK_WIDTH / 2,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
