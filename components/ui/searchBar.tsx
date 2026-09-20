import { Pressable, StyleSheet, type TextInputProps } from 'react-native';
import { GlassInput } from './glassInput';
import { Icon } from './icon';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { triggerLightHaptic } from '../../utils/haptics';
import { withAlpha } from '../../utils/color';

interface SearchBarProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {}

/** A `GlassInput` search field — same frosted look as the bottom nav bar, with
 * an outline `search-outline` icon and a clear (×) button that appears once
 * there's text to clear. Focus feedback (haptic, spring grow, brighter rim)
 * comes from `GlassInput`. */
export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  return (
    <GlassInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderVariant="secondary"
      leftIcon={<Icon name="search-outline" size={20} color={colors.paper} />}
      rightIcon={
        value ? (
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onChangeText?.('');
            }}
            style={styles.clearButton}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Icon name="close-outline" size={14} color={colors.paper} />
          </Pressable>
        ) : undefined
      }
      containerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    minHeight: 48,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
