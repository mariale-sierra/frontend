import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Fill } from '@shopify/react-native-skia';
import { AccentDome } from '../ui/accentDome';
import { WebSafeCanvas } from '../ui/webSafeCanvas';
import { colors } from '../../constants/theme';

interface ChallengeAccentBackdropProps {
  /** The challenge's own activity accent color. */
  color: string;
}

// The wash is a half-moon hanging from the top edge of the screen: 62% of the
// screen's width where it meets the top edge (past 50% it runs off the sides
// there), and 42% of its height at its lowest point.
const DOME_HALF_WIDTH = 0.62;
const DOME_DEPTH = 0.42;
const WASH_PEAK = 0.39;

// The focal bloom sitting in the dome at the top center.
const BLOOM_PEAK = 0.26;
const BLOOM_BLUR_RATIO = 0.04;

const GRAIN_OPACITY = 0.02;

/**
 * Skia backdrop for a challenge-scoped screen (Challenge-Info, the progress
 * screen, Members and Routine-Detail), in that challenge's own activity color:
 * `AccentDome`'s two-tone half-moon wash, bloom and grain hung from the top edge,
 * drawn over `ink` across the whole screen. The challenge cards' glow is the same
 * light at card scale (`AccentGlow`).
 *
 * Same `color` prop as `ChallengeAccentGlow`, so going back is just swapping
 * the import in `app/challenge/[id]/index.tsx`, `members.tsx`,
 * `routine/[day].tsx` and `ChallengeActiveProgressScreen.tsx`.
 */
export function ChallengeAccentBackdrop({ color }: ChallengeAccentBackdropProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <WebSafeCanvas style={StyleSheet.absoluteFill}>
        <Fill color={colors.ink} />

        <AccentDome
          width={width}
          height={height}
          color={color}
          domeHalfWidth={DOME_HALF_WIDTH}
          domeDepth={DOME_DEPTH}
          washPeak={WASH_PEAK}
          bloomPeak={BLOOM_PEAK}
          bloomBlur={width * BLOOM_BLUR_RATIO}
          grainOpacity={GRAIN_OPACITY}
        />
      </WebSafeCanvas>
    </View>
  );
}
