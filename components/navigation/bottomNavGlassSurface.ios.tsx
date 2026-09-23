import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { colors, glass } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface BottomNavGlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
}

/** Native Liquid Glass on iOS 26+, with a tokenized solid tint when the
 * runtime cannot provide the native effect. */
export function BottomNavGlassSurface({ style }: BottomNavGlassSurfaceProps) {
  return (
    <View pointerEvents="none" style={[styles.surface, style]}>
      <GlassView
        style={StyleSheet.absoluteFill}
        glassEffectStyle="regular"
        tintColor={withAlpha(colors.surface, glass.tintOpacity)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
    backgroundColor: withAlpha(colors.surface, glass.tintOpacity),
  },
});
