import { useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, textOpacity, typography } from '../../../constants/theme';

export type RoutineMode = 'workout' | 'rest';

const AnimatedText = Animated.createAnimatedComponent(RNText);

interface RoutineModeToggleProps {
  value: RoutineMode;
  onChange: (nextMode: RoutineMode) => void;
  /** 0 = workout, 1 = rest — the SAME Animated.Value the screen drives its
   * background/button colors from, so the pill's slide+color-morph stays
   * perfectly in lockstep with the rest of the screen's transition (one
   * shared timing, not a separate disconnected animation). */
  progress: Animated.Value;
}

// Segmented control, per design system → Components → Segmented control:
// `surface` track, `big` radius, `xs` internal padding. Active segment reuses
// the standing `primary` (workout day) / `rest` (rest day) pairing already
// established everywhere else a day's workout/rest status needs a color
// (Today's-routine banner, ChallengeStatusCard, numbered cycle badges).
//
// The active-segment fill is a single absolutely-positioned pill that
// slides (translateX) and morphs color (primary -> rest) via `progress`,
// instead of two Pressables each independently toggling their own flat
// background — that old shape made the fill disappear on one side and
// reappear on the other with no in-between frame. Font WEIGHT still snaps
// immediately with `value` (medium/bold are two separate font files per the
// app's DM-Sans-per-weight loading, not something that can be interpolated)
// — only color/opacity animate continuously.
export function RoutineModeToggle({ value, onChange, progress }: RoutineModeToggleProps) {
  const { t } = useTranslation();
  const [trackWidth, setTrackWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  const innerWidth = Math.max(trackWidth - spacing.xs * 2, 0);
  const segmentWidth = innerWidth > 0 ? (innerWidth - spacing.xs) / 2 : 0;

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth + spacing.xs],
  });
  const thumbColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primary, colors.rest],
  });

  const workoutColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.ink, colors.paper] });
  const workoutOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [textOpacity.primary, textOpacity.secondary] });
  const restColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.paper, colors.ink] });
  const restOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [textOpacity.secondary, textOpacity.primary] });

  return (
    <View style={styles.shell} onLayout={handleLayout}>
      {segmentWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              backgroundColor: thumbColor,
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        />
      )}

      <Pressable style={styles.option} onPress={() => onChange('workout')}>
        <AnimatedText style={[styles.label, value === 'workout' && styles.labelBold, { color: workoutColor, opacity: workoutOpacity }]}>
          {t('routineSelect.modeToggle.workout')}
        </AnimatedText>
      </Pressable>
      <Pressable style={styles.option} onPress={() => onChange('rest')}>
        <AnimatedText style={[styles.label, value === 'rest' && styles.labelBold, { color: restColor, opacity: restOpacity }]}>
          {t('routineSelect.modeToggle.rest')}
        </AnimatedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    borderRadius: radius.big,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  thumb: {
    position: 'absolute',
    left: spacing.xs,
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.big,
  },
  option: {
    flex: 1,
    height: 48,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  labelBold: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  },
});
