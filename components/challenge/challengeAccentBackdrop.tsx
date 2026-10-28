import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Fill } from '@shopify/react-native-skia';
import { AccentDome } from '../ui/accentDome';
import { WebSafeCanvas } from '../ui/webSafeCanvas';
import { activityColors, colors } from '../../constants/theme';
import { boostHsvSaturation } from '../../utils/color';

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

// Sprint 10: a bit more saturated than the shared default
// (ACCENT_VIVID_FACTOR, 1.25) — the challenge screens' light read a little dull.
const VIVID_FACTOR = 1.45;
// The boost above already takes every activity color to its HSL saturation cap,
// so going further deepens each one toward its pure hue instead (HSV
// saturation), keeping hue and brightness — Sprint 10. A touch for every
// activity, a bit more for strength's amber, cardio intense's lime and mind
// body's pink.
const DEEPEN_DEFAULT = 1.1;
const DEEPEN_BY_COLOR: Record<string, number> = {
  [activityColors.strength.toUpperCase()]: 1.25,
  [activityColors.cardioIntense.toUpperCase()]: 1.25,
  [activityColors.mindBody.toUpperCase()]: 1.25,
};
const ACTIVITY_COLORS = new Set(Object.values(activityColors).map((color) => color.toUpperCase()));

function backdropColor(color: string) {
  const key = color.toUpperCase();
  if (!ACTIVITY_COLORS.has(key)) return color;
  return boostHsvSaturation(color, DEEPEN_BY_COLOR[key] ?? DEEPEN_DEFAULT);
}

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
          color={backdropColor(color)}
          domeHalfWidth={DOME_HALF_WIDTH}
          domeDepth={DOME_DEPTH}
          washPeak={WASH_PEAK}
          bloomPeak={BLOOM_PEAK}
          bloomBlur={width * BLOOM_BLUR_RATIO}
          grainOpacity={GRAIN_OPACITY}
          vividFactor={VIVID_FACTOR}
        />
      </WebSafeCanvas>
    </View>
  );
}
