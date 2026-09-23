import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Fill } from '@shopify/react-native-skia';
import { AccentDome } from '../ui/accentDome';
import { WebSafeCanvas } from '../ui/webSafeCanvas';
import { colors } from '../../constants/theme';

interface ExerciseAccentBackdropProps {
  /** The exercise's own activity color (its primary category's). */
  color: string;
}

// A half-moon hung from the top edge of the screen: as wide as the screen where it
// meets the edge, and reaching 40% of the way down — far enough to be behind the two
// rows of badges under the name, which are glass and only show as much of the light as
// is there (at a third of the way it had faded out just above them). A little softer
// than the challenge screens' light, since this screen is mostly long text.
const DOME_HALF_WIDTH = 0.6;
const DOME_DEPTH = 0.4;
const WASH_PEAK = 0.34;
const BLOOM_PEAK = 0.22;
const BLOOM_BLUR_RATIO = 0.04;
const GRAIN_OPACITY = 0.02;

/**
 * Skia backdrop for the exercise screen, in the exercise's own activity color: the
 * accent light (`AccentDome`) hung from the top of the screen, over `ink`. Put it
 * first inside the screen, under everything.
 */
export function ExerciseAccentBackdrop({ color }: ExerciseAccentBackdropProps) {
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
