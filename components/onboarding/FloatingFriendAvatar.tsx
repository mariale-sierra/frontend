import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { UserAvatar } from '../ui/userAvatar';
import { colors, shadows } from '../../constants/theme';

const BORDER_WIDTH = 2;
// Distance/degrees doubled, durations shortened, per explicit "make the
// movement more prominent" follow-up — both bigger swings and a livelier
// tempo read as more noticeable than either change alone.
const FLOAT_DISTANCE = 12;
const FLOAT_MS = 1200;
const WIGGLE_DEG = 10;
const WIGGLE_MS = 1000;

interface FloatingFriendAvatarProps {
  /** Hashed to one of the real `activityColors` by `UserAvatar` itself —
   * pick names that land on different colors for visual variety, not for
   * any functional reason. */
  username: string;
  size?: number;
  /** Positioning only (`position: 'absolute'`, `top`/`left`/`right`, …) —
   * this component owns its own look (outline, shadow, motion), the caller
   * only owns where it sits. Same split as this file's sibling
   * `fanImageBase`/`fanImageLeft`/`fanImageRight` in register.tsx. */
  style?: StyleProp<ViewStyle>;
  /** Staggers this instance's loop against a sibling's start time, so two
   * side-by-side avatars don't bob/wiggle in perfect lockstep. */
  delayMs?: number;
  /** Which way the wiggle leans first — pass opposite values for a
   * left/right pair so they tilt toward (or away from) each other instead
   * of moving identically. */
  wiggleDirection?: 1 | -1;
}

/**
 * A small decorative "friend" placeholder — the exact circle + activity
 * color + ink initial recipe `UserAvatar` already uses for a real user with
 * no photo, just reused here for a generic, always-placeholder friend
 * (there's no actual friend data on the register wizard's intro pages).
 * Continuously bobs up/down and wiggles a few degrees, per explicit
 * request ("I want them to move and wiggle a bit") — no existing looping
 * animation convention in this codebase to match (`ChallengeCardShimmer`'s
 * `Animated.loop` is the closest structural reference, but that's a
 * one-directional sweep, not a bob), so this is a new small loop: two
 * independent native-driver `Animated.loop`s (translateY + rotate), never
 * fontSize/layout properties, matching this app's established
 * native-driver-safe-properties-only rule for looping/interactive
 * animation.
 */
export function FloatingFriendAvatar({
  username,
  size = 36,
  style,
  delayMs = 0,
  wiggleDirection = 1,
}: FloatingFriendAvatarProps) {
  const float = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: FLOAT_MS,
          delay: delayMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: FLOAT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, {
          toValue: 1,
          duration: WIGGLE_MS,
          delay: delayMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: -1,
          duration: WIGGLE_MS * 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0,
          duration: WIGGLE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    wiggleLoop.start();
    return () => {
      floatLoop.stop();
      wiggleLoop.stop();
    };
  }, [float, wiggle, delayMs]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -FLOAT_DISTANCE] });
  const rotate = wiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${-WIGGLE_DEG * wiggleDirection}deg`, `${WIGGLE_DEG * wiggleDirection}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { borderRadius: size / 2 + BORDER_WIDTH, transform: [{ translateY }, { rotate }] },
        style,
      ]}
    >
      <UserAvatar username={username} size={size} circle />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: BORDER_WIDTH,
    borderColor: colors.surface,
    ...shadows.sm,
  },
});
