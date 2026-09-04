import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { colors, fillOpacity, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import {
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_INDICATOR_INSET,
  BOTTOM_NAV_TRAVEL_SCALE_X,
  BOTTOM_NAV_TRAVEL_SCALE_Y,
} from '../../constants/bottomNav';
import { useBottomNavContext } from './bottomNavContext';

interface BottomNavIndicatorProps {
  tabSlotWidth: number;
}

/**
 * The single shared "active tab" capsule — one physical element that
 * translates between tab slots (per explicit "must be the SAME oval
 * physically moving, never two independent backgrounds fading in/out"
 * requirement), not a per-tab background. Lives inside the decorative
 * `tabBarBackground` layer (see bottomNavBackground.tsx), which React
 * Navigation already renders `pointerEvents="none"` — purely visual, the
 * real touch targets are the tabBarButtons drawn on top of it.
 */
export function BottomNavIndicator({ tabSlotWidth }: BottomNavIndicatorProps) {
  const { activeIndex, indicatorStretch } = useBottomNavContext();

  const indicatorWidth = Math.max(tabSlotWidth - BOTTOM_NAV_INDICATOR_INSET * 2, 0);
  const indicatorHeight = BOTTOM_NAV_HEIGHT - BOTTOM_NAV_INDICATOR_INSET * 2;

  const animatedStyle = useAnimatedStyle(() => {
    const stretch = indicatorStretch.value;
    return {
      transform: [
        { translateX: activeIndex.value * tabSlotWidth + BOTTOM_NAV_INDICATOR_INSET },
        { scaleX: 1 + stretch * (BOTTOM_NAV_TRAVEL_SCALE_X - 1) },
        { scaleY: 1 + stretch * (BOTTOM_NAV_TRAVEL_SCALE_Y - 1) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.indicator,
        { width: indicatorWidth, height: indicatorHeight, top: BOTTOM_NAV_INDICATOR_INSET },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    left: 0,
    borderRadius: radius.big,
    // Translucent gray chip, not a solid bright fill — per explicit "should
    // read as glassy, not white" correction. `fillOpacity.chip` (0.14) is
    // this app's own already-formalized token for exactly this role ("a
    // pill/chip/round secondary-control fill sitting on ink/surface").
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
});
