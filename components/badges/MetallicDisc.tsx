import type { ReactNode } from 'react';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { badgeColors, colors, fillOpacity } from '../../constants/theme';
import type { BadgeTier } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

// The rim, as a share of the disc's size.
const RIM_SHARE = 0.09;
// The locked progress ring's width, as a share of the disc's size.
const RING_SHARE = 0.06;

/** Gradient ids are global to an SVG document — one set per disc. */
function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
}

interface MetallicDiscProps {
  tier: BadgeTier;
  size: number;
  children: ReactNode;
}

/**
 * An earned badge as a small medal in its tier's metal (`badgeColors`):
 *  - a beveled rim, shaded the opposite way to the face so the edge catches light;
 *  - the face, a diagonal sheen from the top-left — highlight, metal, a bright
 *    band across the middle, metal, shadow — the way light crosses polished metal;
 *  - a faint glow under it in its own metal.
 * The icon (`ink`) sits on top.
 */
export function MetallicDisc({ tier, size, children }: MetallicDiscProps) {
  const metal = badgeColors[tier];
  const faceId = useSvgId('face');
  const rimId = useSvgId('rim');
  const center = size / 2;
  const rim = size * RIM_SHARE;

  return (
    <View
      style={[styles.disc, { width: size, height: size, borderRadius: size / 2, shadowColor: metal.base }]}
      testID={`metallic-disc-${tier}`}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={faceId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={metal.light} />
            <Stop offset="0.3" stopColor={metal.base} />
            <Stop offset="0.5" stopColor={metal.light} />
            <Stop offset="0.68" stopColor={metal.base} />
            <Stop offset="1" stopColor={metal.dark} />
          </LinearGradient>
          {/* The other way round: dark at the top-left, light at the bottom-right. */}
          <LinearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={metal.dark} />
            <Stop offset="0.5" stopColor={metal.base} />
            <Stop offset="1" stopColor={metal.light} />
          </LinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={center} fill={`url(#${rimId})`} />
        <Circle cx={center} cy={center} r={center - rim} fill={`url(#${faceId})`} />
      </Svg>
      {children}
    </View>
  );
}

interface LockedDiscProps {
  tier: BadgeTier;
  size: number;
  /** progress / target, 0…1. */
  progress: number;
  children: ReactNode;
}

/**
 * A badge not earned yet: a dim disc ringed by its progress toward the badge, the
 * ring in the metal it's working toward — a 7-day streak at 3 days is a silver
 * ring three-sevenths of the way round. The icon is dimmed on top.
 */
export function LockedDisc({ tier, size, progress, children }: LockedDiscProps) {
  const ring = Math.max(2, size * RING_SHARE);
  const center = size / 2;
  const r = center - ring / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.locked, { width: size, height: size }]} testID={`locked-disc-${tier}`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={center} cy={center} r={center - ring} fill={withAlpha(colors.paper, fillOpacity.subtle)} />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={withAlpha(colors.paper, fillOpacity.strong)}
          strokeWidth={ring}
          fill="none"
        />
        {ratio > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={badgeColors[tier].base}
            strokeWidth={ring}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * ratio} ${circumference}`}
            // From 12 o'clock, clockwise.
            transform={`rotate(-90 ${center} ${center})`}
            testID="locked-disc-progress"
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    // A faint glow in the disc's own metal (`shadowColor` set inline).
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  locked: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
