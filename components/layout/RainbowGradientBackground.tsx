import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { useIsFocused } from 'expo-router';
import { Circle, Fill, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { MESH_FALLOFF } from '../ui/accentMesh';
import { ACCENT_VIVID_FACTOR } from '../ui/accentDome';
import { activityColors, colors } from '../../constants/theme';
import { RAINBOW_FIELDS, RAINBOW_LOOP_MS } from '../../constants/rainbowBackground';
import type { RainbowField } from '../../constants/rainbowBackground';
import { boostSaturation, withAlpha } from '../../utils/color';
import { rainbowFieldTransform } from '../../utils/rainbowMotion';
import { WebSafeCanvas } from '../ui/webSafeCanvas';

interface RainbowGradientBackgroundProps {
  style?: StyleProp<ViewStyle>;
}

// Whether the person has asked their phone to cut down on motion (a system
// accessibility setting), followed as it changes.
function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

interface RainbowFieldViewProps {
  field: RainbowField;
  phase: SharedValue<number>;
  width: number;
  height: number;
}

// One field: a unit circle with a radial gradient, placed by the transform the
// loop drives (translated, turned and scaled into a big soft ellipse).
function RainbowFieldView({ field, phase, width, height }: RainbowFieldViewProps) {
  // The color is made the way the dome light's is — the same boost on the same
  // token — and dimmed only by its alpha over `ink`, so it has the same saturation
  // as the info screens' light and the cards' mesh.
  const color = boostSaturation(activityColors[field.activity], ACCENT_VIVID_FACTOR);
  const transform = useDerivedValue(() => rainbowFieldTransform(field, phase.value, width, height));

  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={1} dither>
        <RadialGradient
          c={vec(0, 0)}
          r={1}
          colors={MESH_FALLOFF.map(([, share]) => withAlpha(color, field.peak * share))}
          positions={MESH_FALLOFF.map(([position]) => position)}
        />
      </Circle>
    </Group>
  );
}

/**
 * The create-challenge flow's background: a slow, dim rainbow — a few very large
 * activity-color fields (see `RAINBOW_FIELDS`) added together over `ink`, easing
 * out into it along a long gradual tail — that DRIFTS: each field wanders around
 * its place, turns a little and breathes, on one seamless loop (`RAINBOW_LOOP_MS`).
 *
 * The motion is a frame callback advancing one shared `phase` on the UI thread and
 * every field's transform derived from it, so nothing crosses to JS per frame. It
 * runs only while the screen is in front (a screen further down the stack, or the
 * app in another state, is not being looked at) and only if the person has not
 * asked for reduced motion — then it rests at the composition the layout was
 * tuned as. No blur filter, and no grain (a grain shader every frame is dear); the
 * fields are dithered against banding instead, which is what the grain was for.
 */
export function RainbowGradientBackground({ style }: RainbowGradientBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const animate = focused && !reduceMotion;

  const phase = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    'worklet';
    phase.value = (phase.value + (info.timeSincePreviousFrame ?? 0) / RAINBOW_LOOP_MS) % 1;
  }, false);

  useEffect(() => {
    frame.setActive(animate);
  }, [frame, animate]);

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <WebSafeCanvas style={StyleSheet.absoluteFill}>
        <Fill color={colors.ink} />

        {/* `plus` (additive), like the dome's bloom and the cards' fields:
            overlapping fields blend into in-between hues and only brighten. */}
        <Group blendMode="plus">
          {RAINBOW_FIELDS.map((field) => (
            <RainbowFieldView key={field.activity} field={field} phase={phase} width={width} height={height} />
          ))}
        </Group>
      </WebSafeCanvas>
    </View>
  );
}
