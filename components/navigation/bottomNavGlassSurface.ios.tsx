import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface BottomNavGlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  tone?: 'dark' | 'light';
}

/** Native Liquid Glass on iOS 26+, with a tokenized solid tint when the
 * runtime cannot provide the native effect. */
export function BottomNavGlassSurface({ style, tone = 'dark' }: BottomNavGlassSurfaceProps) {
  const tintColor = tone === 'light' ? colors.paper : colors.surface;

  return (
    <View
      pointerEvents="none"
      style={[styles.surface, tone === 'light' ? styles.lightSurface : styles.darkSurface, style]}
    >
      <GlassView
        style={StyleSheet.absoluteFill}
        glassEffectStyle="regular"
        tintColor={withAlpha(tintColor, glass.tintOpacity)}
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
});
