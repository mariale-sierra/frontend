import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { GlassBackdrop, glassBorderStyle } from './glassSurface';
import { Icon } from './icon';
import { Text } from './text';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import {
  BOTTOM_NAV_BREATHE_SCALE_X,
  BOTTOM_NAV_BREATHE_SCALE_Y,
  BOTTOM_NAV_BREATHE_SPRING,
  BOTTOM_NAV_TRAVEL_SCALE_X,
  BOTTOM_NAV_TRAVEL_SCALE_Y,
} from '../../constants/bottomNav';
import { withAlpha } from '../../utils/color';
import { triggerLightHaptic } from '../../utils/haptics';
import { getSegmentGeometry } from '../../utils/segmentedControl';
import { settleBottomNavIndicator } from '../navigation/bottomNavContext';

const TRACK_PADDING = spacing.xs;
const SEGMENT_GAP = spacing.xs;
const DEFAULT_SEGMENT_HEIGHT = 40;
const ICON_SIZE = 20;

type IconName = React.ComponentProps<typeof Icon>['name'];

/** One segment: a text `label`, an `icon`, or both is not supported — give it
 * one or the other. Icon-only segments need an `accessibilityLabel`. */
export interface GlassSegment<T extends string> {
  key: T;
  label?: string;
  icon?: IconName;
  accessibilityLabel?: string;
}

interface GlassSegmentedControlProps<T extends string> {
  segments: readonly GlassSegment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Height of each segment (the track adds its padding around them). */
  segmentHeight?: number;
  /** Fixed width of each segment. Leave unset to fill the available width and
   * divide it evenly; set it for a compact control that sizes itself (then
   * place it with `style`, e.g. `alignSelf: 'center'`). */
  segmentWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A segmented control that behaves like the bottom nav bar: a frosted-glass
 * track with ONE translucent chip that physically slides between segments
 * (same spring, and the same slight stretch while it travels), a light haptic
 * whenever the selection changes, and a gentle "breathe" of the track while
 * it's pressed. Tap a segment, or drag across the track and the chip follows
 * your finger, settling on the nearest segment when you let go.
 *
 * The drag only claims horizontal movement, so it doesn't fight a vertical
 * list the control sits in. `segments` must have at least one entry, and
 * `value` should be one of their keys.
 */
export function GlassSegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  segmentHeight = DEFAULT_SEGMENT_HEIGHT,
  segmentWidth: fixedSegmentWidth,
  style,
}: GlassSegmentedControlProps<T>) {
  const count = segments.length;
  const selectedIndex = Math.max(
    segments.findIndex((segment) => segment.key === value),
    0,
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const { segmentWidth, step } = getSegmentGeometry(trackWidth, count, TRACK_PADDING, SEGMENT_GAP);
  const fixedTrackWidth =
    fixedSegmentWidth === undefined
      ? undefined
      : TRACK_PADDING * 2 + SEGMENT_GAP * (count - 1) + fixedSegmentWidth * count;

  // The chip's position in segments (fractional while dragging or settling).
  const position = useSharedValue(selectedIndex);
  const stretch = useSharedValue(0);
  const expansion = useSharedValue(0);
  const dragOrigin = useSharedValue(selectedIndex);
  const lastHapticIndex = useSharedValue(selectedIndex);

  // The selection can also change from outside (a deep link, another control):
  // follow it. A change we caused ourselves has already settled the chip.
  useEffect(() => {
    if (Math.round(position.value) !== selectedIndex) {
      settleBottomNavIndicator(position, stretch, selectedIndex);
    }
  }, [selectedIndex, position, stretch]);

  const commit = useCallback(
    (index: number) => {
      const next = segments[index];
      if (next && next.key !== value) {
        onChange(next.key);
      }
    },
    [segments, value, onChange],
  );

  const selectFromAccessibility = useCallback(
    (index: number) => {
      settleBottomNavIndicator(position, stretch, index);
      commit(index);
    },
    [commit, position, stretch],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-10, 10])
        .onBegin(() => {
          expansion.value = withSpring(1, BOTTOM_NAV_BREATHE_SPRING);
          dragOrigin.value = position.value;
          lastHapticIndex.value = Math.round(position.value);
        })
        .onUpdate((event) => {
          if (step <= 0) {
            return;
          }
          const clamped = Math.min(Math.max(dragOrigin.value + event.translationX / step, 0), count - 1);
          position.value = clamped;
          const nearest = Math.round(clamped);
          if (nearest !== lastHapticIndex.value) {
            lastHapticIndex.value = nearest;
            runOnJS(triggerLightHaptic)();
          }
        })
        .onEnd(() => {
          const nearest = Math.min(Math.max(Math.round(position.value), 0), count - 1);
          settleBottomNavIndicator(position, stretch, nearest);
          runOnJS(commit)(nearest);
        })
        .onFinalize(() => {
          expansion.value = withSpring(0, BOTTOM_NAV_BREATHE_SPRING);
        }),
    [commit, count, dragOrigin, expansion, lastHapticIndex, position, step, stretch],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .onBegin(() => {
          expansion.value = withSpring(1, BOTTOM_NAV_BREATHE_SPRING);
        })
        .onEnd((event, success) => {
          if (!success || step <= 0) {
            return;
          }
          const index = Math.min(
            Math.max(Math.floor((event.x - TRACK_PADDING + SEGMENT_GAP / 2) / step), 0),
            count - 1,
          );
          const previous = Math.round(position.value);
          settleBottomNavIndicator(position, stretch, index);
          if (index !== previous) {
            runOnJS(triggerLightHaptic)();
          }
          runOnJS(commit)(index);
        })
        .onFinalize(() => {
          expansion.value = withSpring(0, BOTTOM_NAV_BREATHE_SPRING);
        }),
    [commit, count, expansion, position, step, stretch],
  );

  const gesture = useMemo(() => Gesture.Race(pan, tap), [pan, tap]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: 1 + expansion.value * (BOTTOM_NAV_BREATHE_SCALE_X - 1) },
      { scaleY: 1 + expansion.value * (BOTTOM_NAV_BREATHE_SCALE_Y - 1) },
    ],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: TRACK_PADDING + position.value * step },
      { scaleX: 1 + stretch.value * (BOTTOM_NAV_TRAVEL_SCALE_X - 1) },
      { scaleY: 1 + stretch.value * (BOTTOM_NAV_TRAVEL_SCALE_Y - 1) },
    ],
  }));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        collapsable={false}
        onLayout={handleLayout}
        style={[
          styles.track,
          { height: segmentHeight + TRACK_PADDING * 2 },
          fixedTrackWidth !== undefined && { width: fixedTrackWidth },
          trackStyle,
          style,
        ]}
      >
        <GlassBackdrop />
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            collapsable={false}
            style={[styles.indicator, { width: segmentWidth, height: segmentHeight }, indicatorStyle]}
          />
        ) : null}
        <View style={styles.row}>
          {segments.map((segment, index) => (
            <SegmentLabel
              key={segment.key}
              segment={segment}
              height={segmentHeight}
              index={index}
              selected={index === selectedIndex}
              position={position}
              onAccessibilitySelect={selectFromAccessibility}
            />
          ))}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface SegmentLabelProps<T extends string> {
  segment: GlassSegment<T>;
  height: number;
  index: number;
  selected: boolean;
  position: SharedValue<number>;
  onAccessibilitySelect: (index: number) => void;
}

/** One segment's content. The inactive and active looks are two stacked layers
 * cross-faded by how close the chip is, so it "picks up" the chip continuously
 * as the chip slides past (or is dragged past). */
function SegmentLabel<T extends string>({
  segment,
  height,
  index,
  selected,
  position,
  onAccessibilitySelect,
}: SegmentLabelProps<T>) {
  const activeStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(Math.abs(position.value - index), 1),
  }));
  const inactiveStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(position.value - index), 1),
  }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={segment.accessibilityLabel ?? segment.label}
      accessibilityState={{ selected }}
      onAccessibilityTap={() => onAccessibilitySelect(index)}
      style={[styles.segment, { height }]}
    >
      <Animated.View collapsable={false} style={[styles.labelLayer, inactiveStyle]}>
        {segment.icon ? (
          <Icon name={segment.icon} size={ICON_SIZE} color={withAlpha(colors.paper, textOpacity.secondary)} />
        ) : (
          <Text variant="label" weight="medium" tone="secondary">
            {segment.label}
          </Text>
        )}
      </Animated.View>
      <Animated.View collapsable={false} style={[styles.labelLayer, activeStyle]}>
        {segment.icon ? (
          <Icon name={segment.icon} size={ICON_SIZE} color={colors.paper} />
        ) : (
          <Text variant="label" weight="bold">
            {segment.label}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.big,
    overflow: 'hidden',
    ...glassBorderStyle,
  },
  // The one sliding chip — same translucent `paper` fill the nav bar's
  // indicator uses (`fillOpacity.chip`).
  indicator: {
    position: 'absolute',
    left: 0,
    top: TRACK_PADDING,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
  row: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    padding: TRACK_PADDING,
    gap: SEGMENT_GAP,
  },
  segment: {
    flex: 1,
  },
  labelLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
