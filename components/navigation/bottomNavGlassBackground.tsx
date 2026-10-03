import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { borderWidth, colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import {
  BOTTOM_NAV_BOTTOM_INSET,
  BOTTOM_NAV_BREATHE_SCALE_X,
  BOTTOM_NAV_BREATHE_SCALE_Y,
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_OUTER_MARGIN,
  getBottomNavGlassGeometry,
} from '../../constants/bottomNav';
import { useBottomNavContext } from './bottomNavContext';
import { BottomNavGlassSurface } from './bottomNavGlassSurface';
import { BottomNavIndicator } from './bottomNavIndicator';

/**
 * Production cross-platform navigation capsule. It contains exactly the
 * four routable tabs; the add action is rendered in the separate navigator
 * item after the capsule and its explicit gap.
 */
export function BottomNavGlassBackground() {
  const { width } = useWindowDimensions();
  const { navCapsuleWidth, tabSlotWidth, indicatorWidth } = getBottomNavGlassGeometry(width);
  const { barExpansion } = useBottomNavContext();
  const insets = useSafeAreaInsets();

  const shellBottom = BOTTOM_NAV_BOTTOM_INSET + insets.bottom;
  const shellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: 1 + barExpansion.value * (BOTTOM_NAV_BREATHE_SCALE_X - 1) },
      { scaleY: 1 + barExpansion.value * (BOTTOM_NAV_BREATHE_SCALE_Y - 1) },
    ],
  }));

  return (
    <>
      <View style={styles.tabBarBase} />
      {navCapsuleWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.shell, { width: navCapsuleWidth, bottom: shellBottom }, shellAnimatedStyle]}
        >
          <BottomNavGlassSurface style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={styles.sheen} />
          <BottomNavIndicator tabSlotWidth={tabSlotWidth} indicatorWidth={indicatorWidth} />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  tabBarBase: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  shell: {
    position: 'absolute',
    left: BOTTOM_NAV_OUTER_MARGIN,
    height: BOTTOM_NAV_HEIGHT,
    borderRadius: BOTTOM_NAV_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: borderWidth.fine,
    borderColor: withAlpha(colors.paper, glass.borderOpacity),
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderRadius: BOTTOM_NAV_HEIGHT / 2,
    borderTopWidth: borderWidth.fine,
    borderTopColor: withAlpha(colors.paper, glass.sheenOpacity),
  },
});
