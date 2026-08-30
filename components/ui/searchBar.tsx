import { Pressable, StyleSheet, type TextInputProps } from 'react-native';
import { Input } from './input';
import { Icon } from './icon';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface SearchBarProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {}

/** `big`-radius `surface` search field — outline `search-outline` icon (not
 * the filled `search` this used to render), and a clear (×) button that
 * appears once there's text to clear, matching the wireframe. */
export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderVariant="secondary"
      variant="filled"
      leftIcon={<Icon name="search-outline" size={20} color={colors.paper} />}
      rightIcon={
        value ? (
          <Pressable
            onPress={() => onChangeText?.('')}
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
    borderRadius: radius.big,
    backgroundColor: colors.surface,
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
