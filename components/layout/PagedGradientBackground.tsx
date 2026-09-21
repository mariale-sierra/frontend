import { Animated, StyleSheet, View } from 'react-native';
import { PaperGradientBackground } from './PaperGradientBackground';

export interface GradientPages {
  /** The light's color on each page — one per card of the carousel. */
  colors: string[];
  /** The carousel's horizontal scroll offset, as it scrolls. */
  scrollX: Animated.Value;
  /** How far the carousel scrolls from one page to the next, in px. */
  pageWidth: number;
}

interface PagedGradientBackgroundProps extends GradientPages {
  edge?: 'top' | 'bottom';
}

/**
 * The paper spotlight in the color of the current page of a carousel, following
 * the scroll: one light per distinct color, stacked, each faded in as its page
 * comes into view and out as it leaves (`scrollX` driving each one's opacity
 * natively, so it tracks the finger). The lights are only lights — `ScreenBackground`'s
 * `ink` is behind them all — so two fading past each other blend instead of dipping
 * dark. A carousel of pages of one color has a single light that never changes; more
 * than one page of a color (two challenges of the same activity) still share one light.
 */
export function PagedGradientBackground({ colors: pageColors, scrollX, pageWidth, edge }: PagedGradientBackgroundProps) {
  const lightColors = [...new Set(pageColors)];
  // Where each page's scroll offset is; one page has nothing to scroll between.
  const inputRange = pageColors.map((_, index) => index * pageWidth);
  const scrolls = pageColors.length > 1 && pageWidth > 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {lightColors.map((color) => (
        <Animated.View
          key={color}
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: scrolls
                ? scrollX.interpolate({
                    inputRange,
                    outputRange: pageColors.map((pageColor) => (pageColor === color ? 1 : 0)),
                    extrapolate: 'clamp',
                  })
                : 1,
            },
          ]}
        >
          <PaperGradientBackground edge={edge} tint={color} />
        </Animated.View>
      ))}
    </View>
  );
}
