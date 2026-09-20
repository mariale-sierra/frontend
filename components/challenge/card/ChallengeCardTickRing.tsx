import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, vec } from '@shopify/react-native-skia';
import { AccentDome } from '../../ui/accentDome';
import { colors, spacing } from '../../../constants/theme';

const RING_SIZE = 104;
// How long each tick is, running in from the ring's outer edge.
const TICK_LENGTH = 13;
// The ring is a fixed 60 ticks (one every 6 degrees), each a 1.8-degree sliver —
// 30% of its slot. A dashed stroke draws them all as one element.
const TICK_COUNT = 60;
const TICK_SHARE = 0.3;
// The glow inside the ring is the same half-moon light as the card's, from one of
// the face's edges at face scale — a little stronger, since it's small.
const FACE_GLOW = {
  domeHalfWidth: 0.62,
  domeDepth: 0.8,
  washPeak: 0.3,
  bloomPeak: 0.12,
} as const;

interface ChallengeCardTickRingProps {
  /** The challenge's own activity color, for the ticks and the glow. */
  accentColor: string;
  /** What sits in the middle of the ring (a number and a caption). */
  children?: ReactNode;
  /** The edge of the face its light comes from — the same edge as the card's own
   * glow, so the two agree. Default `bottom`. */
  glowEdge?: 'top' | 'bottom';
}

/**
 * A ring of accent ticks around a softly glowing face, with content in its
 * middle — the Explore card's side panel, a small echo of the tick ring on the
 * challenge's Progress screen. Drawn in one small fixed-size Skia canvas: a
 * dashed circle for the ticks, and `AccentDome` (the same light as the card's
 * glow and the screens' backdrop) clipped to the face. Centered in a column a
 * little wider than the ring itself.
 */
export function ChallengeCardTickRing({ accentColor, children, glowEdge = 'bottom' }: ChallengeCardTickRingProps) {
  const center = RING_SIZE / 2;
  // The ticks are the stroke of a circle at their midline; the face is what's inside them.
  const tickRadius = center - TICK_LENGTH / 2;
  const faceRadius = center - TICK_LENGTH;
  const faceSize = faceRadius * 2;
  const faceOrigin = center - faceRadius;
  const slot = (2 * Math.PI * tickRadius) / TICK_COUNT;
  const tick = slot * TICK_SHARE;
  // A rounded rect with a radius of half its side is a circle — the shape the
  // face's light is clipped to. Plain objects, not Skia's `rect()` / `rrect()`
  // helpers, so drawing it needs no native call.
  const faceClip = {
    rect: { x: faceOrigin, y: faceOrigin, width: faceSize, height: faceSize },
    rx: faceRadius,
    ry: faceRadius,
  };

  return (
    <View style={styles.column}>
      <View style={styles.ring}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Starts at 12 o'clock and runs clockwise, like the Progress screen's ring
              (a Skia circle starts at 3 o'clock, so it's turned a quarter back). */}
          <Group transform={[{ rotate: -Math.PI / 2 }]} origin={vec(center, center)}>
            <Circle cx={center} cy={center} r={tickRadius} style="stroke" strokeWidth={TICK_LENGTH} color={accentColor}>
              <DashPathEffect intervals={[tick, slot - tick]} />
            </Circle>
          </Group>

          <Circle cx={center} cy={center} r={faceRadius} color={colors.ink} />
          <Group clip={faceClip}>
            <Group transform={[{ translateX: faceOrigin }, { translateY: faceOrigin }]}>
              <AccentDome width={faceSize} height={faceSize} color={accentColor} edge={glowEdge} {...FACE_GLOW} />
            </Group>
          </Group>
        </Canvas>
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
