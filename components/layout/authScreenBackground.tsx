import { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

interface AuthScreenBackgroundProps extends ViewProps {
  children: ReactNode;
  applyTopInset?: boolean;
}

/**
 * Full-bleed illustrated background (`assets/images/login&register.png`,
 * user-provided) behind the auth screens (login/register). Was a
 * code-generated six-glow SVG gradient (one per activity color) — replaced
 * with this real asset per explicit request. Not a token-driven gradient
 * exception anymore, so it isn't tracked alongside `ScreenBackground`/
 * `RestDayScreenBackground` in the "no gradients" rule — it's a static
 * illustration asset, same category as `RestDay.png` was before its own
 * screen moved to a token-based background.
 *
 * Uses `ImageBackground` (not a manually absolute-positioned `Image`
 * sibling) — that first version only ever showed one corner of the image,
 * because a plain `Image` with `StyleSheet.absoluteFillObject` needs its
 * parent to have already resolved a concrete size before `resizeMode="cover"`
 * can compute the right scale, which isn't guaranteed through a deep
 * nested-flex chain. `ImageBackground` manages that itself and is the React
 * Native-blessed component for exactly this "background image behind
 * content" shape.
 */
export function AuthScreenBackground({
  children,
  applyTopInset = true,
  style,
  ...props
}: AuthScreenBackgroundProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('../../assets/images/login&register.png')}
      resizeMode="cover"
      style={[styles.container, style]}
      {...props}
    >
      <View style={[styles.content, applyTopInset && { paddingTop: insets.top }]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flex: 1,
  },
});
