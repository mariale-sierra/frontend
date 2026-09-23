import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface BottomNavGlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
}

/** Stable Android/Web material layer; iOS resolves to the native GlassView
 * implementation in `bottomNavGlassSurface.ios.tsx`. */
export function BottomNavGlassSurface({ style }: BottomNavGlassSurfaceProps) {
  const webBlurStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${glass.blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${glass.blurIntensity}px)`,
        } as unknown as ViewStyle)
      : null;
  const blurMethod = Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined;

  return (
    <View pointerEvents="none" style={[styles.surface, style]}>
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.tint}
        blurMethod={blurMethod}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.tint, webBlurStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
    backgroundColor: withAlpha(colors.surface, glass.tintOpacity),
  },
  tint: {
    backgroundColor: withAlpha(colors.surface, glass.tintOpacity),
  },
});
