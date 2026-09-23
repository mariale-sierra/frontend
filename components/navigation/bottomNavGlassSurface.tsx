import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface BottomNavGlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  tone?: 'dark' | 'light';
}

/** Stable Android/Web material layer; iOS resolves to the native GlassView
 * implementation in `bottomNavGlassSurface.ios.tsx`. */
export function BottomNavGlassSurface({ style, tone = 'dark' }: BottomNavGlassSurfaceProps) {
  const tintColor = tone === 'light' ? colors.paper : colors.surface;
  const webBlurStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${glass.blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${glass.blurIntensity}px)`,
        } as unknown as ViewStyle)
      : null;
  const blurMethod = Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined;

  return (
    <View
      pointerEvents="none"
      style={[styles.surface, tone === 'light' ? styles.lightSurface : styles.darkSurface, style]}
    >
      <BlurView
        intensity={glass.blurIntensity}
        tint={tone === 'light' ? 'light' : glass.tint}
        blurMethod={blurMethod}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.tint,
          { backgroundColor: withAlpha(tintColor, glass.tintOpacity) },
          webBlurStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
  },
  darkSurface: {
    backgroundColor: withAlpha(colors.surface, glass.tintOpacity),
  },
  lightSurface: {
    backgroundColor: colors.paper,
  },
  tint: {},
});
