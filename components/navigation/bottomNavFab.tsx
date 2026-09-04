import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius } from '../../constants/theme';
import {
  BOTTOM_NAV_BOTTOM_INSET,
  BOTTOM_NAV_FAB_PRESS_SCALE,
  BOTTOM_NAV_FAB_SIZE,
  BOTTOM_NAV_PRESS_SPRING,
} from '../../constants/bottomNav';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BottomNavFabProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * The "+" action — deliberately its own separate circle, not a 5th tab: no
 * label, never receives the shared tab indicator, solid `primary` (unlike
 * the translucent tab capsule) so it reads as the higher-contrast CTA.
 * Same height as the tab capsule (`BOTTOM_NAV_FAB_SIZE` ===
 * `BOTTOM_NAV_HEIGHT`) so the two read as siblings, not one dominating the
 * other — the previous design's large negative-margin "poke above the bar"
 * treatment is intentionally gone.
 */
export function BottomNavFab({ onPress, accessibilityLabel }: BottomNavFabProps) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePressIn() {
    scale.value = withSpring(BOTTOM_NAV_FAB_PRESS_SCALE, BOTTOM_NAV_PRESS_SPRING);
  }

  function handlePressOut() {
    scale.value = withSpring(1, BOTTOM_NAV_PRESS_SPRING);
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[styles.fab, pressStyle]}
    >
      <Ionicons name="add-outline" size={24} color={colors.ink} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Absolute + bottom-anchored against its own item slot — see
  // BottomNavTabButton's own doc comment for why (matches the tab buttons
  // and the background capsule, all three anchored the same way).
  fab: {
    position: 'absolute',
    left: 0,
    bottom: BOTTOM_NAV_BOTTOM_INSET,
    width: BOTTOM_NAV_FAB_SIZE,
    height: BOTTOM_NAV_FAB_SIZE,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
