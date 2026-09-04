import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import {
  BOTTOM_NAV_BOTTOM_INSET,
  BOTTOM_NAV_BREATHE_SCALE_X,
  BOTTOM_NAV_BREATHE_SCALE_Y,
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_OUTER_MARGIN,
  getBottomNavGeometry,
} from '../../constants/bottomNav';
import { useBottomNavContext } from './bottomNavContext';
import { BottomNavIndicator } from './bottomNavIndicator';

// ROOT CAUSE, CONFIRMED ON DEVICE (iOS, New Architecture/Fabric enabled) —
// setting `tabBarStyle` on <Tabs screenOptions> (directly, via
// screenOptions, or per-screen) makes the ENTIRE tab bar unresponsive to
// touch, app-wide. A fully custom `tabBar` render-prop was also tried and
// scrapped for very likely hitting this same root cause from a different
// angle. See app/(tabs)/_layout.tsx's own top comment for the full history
// — this component (like the design it replaces) gets 100% of its visual
// styling through `tabBarBackground` (this file, wrapped in
// `pointerEvents="none"` by React Navigation itself) + `tabBarItemStyle` +
// custom `tabBarButton`s, and touches NEITHER `tabBarStyle` NOR a custom
// `tabBar` prop. Do not "simplify" this into either of those without
// re-reading that history and re-testing touch on a real iOS device first.
export function BottomNavBackground() {
  const { width } = useWindowDimensions();
  const { navCapsuleWidth, tabSlotWidth, indicatorWidth } = getBottomNavGeometry(width);
  const { barExpansion } = useBottomNavContext();
  const insets = useSafeAreaInsets();

  // React Navigation renders `tabBarBackground` (this component) and the
  // real tabBarButton row as two SEPARATE boxes that do NOT share a bottom
  // edge: the button row sits inside the tab bar's own safe-area-reduced
  // content box, while this decorative layer fills the tab bar's full outer
  // box (confirmed empirically on device — the capsule rendered noticeably
  // lower than the real buttons until this was added). Adding the bottom
  // safe-area inset here is what makes this layer's coordinate space match
  // the real buttons' — do not remove this without re-verifying on a real
  // notched-iPhone AND an Android gesture-nav device, since the gap only
  // shows up where `insets.bottom` is non-zero.
  const capsuleBottom = BOTTOM_NAV_BOTTOM_INSET + insets.bottom;

  const capsuleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: 1 + barExpansion.value * (BOTTOM_NAV_BREATHE_SCALE_X - 1) },
      { scaleY: 1 + barExpansion.value * (BOTTOM_NAV_BREATHE_SCALE_Y - 1) },
    ],
  }));

  return (
    <>
      {/* Full-bleed, un-rounded, 2px-above-its-own-top-edge — hides React
          Navigation's own default hairline border on the outer tab bar
          container, completely independent of whatever shape is drawn on
          top of it. Verbatim precedent from the previous single-capsule
          design; see app/(tabs)/_layout.tsx's own history for why this
          exact technique (not `tabBarStyle`) is what covers that border. */}
      <View style={styles.tabBarBase} />

      {navCapsuleWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.navCapsule, { width: navCapsuleWidth, bottom: capsuleBottom }, capsuleAnimatedStyle]}
        >
          {/* Real blur on iOS; on Android, `expo-blur`'s own documented
              default (`experimentalBlurMethod: 'none'`) falls back to a
              plain semi-transparent view instead of attempting the
              experimental (perf/graphics-risk) native Android blur — paired
              with the solid tint below, this still reads as a deliberate
              translucent glass bar on both platforms, never a broken one. */}
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.navCapsuleTint} />
          <BottomNavIndicator tabSlotWidth={tabSlotWidth} indicatorWidth={indicatorWidth} />
        </Animated.View>
      )}
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
    backgroundColor: colors.ink,
  },
  navCapsule: {
    position: 'absolute',
    left: BOTTOM_NAV_OUTER_MARGIN,
    height: BOTTOM_NAV_HEIGHT,
    borderRadius: BOTTOM_NAV_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withAlpha(colors.paper, 0.08),
  },
  navCapsuleTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(colors.surface, 0.72),
  },
});
