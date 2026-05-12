import type { TextInputProps } from 'react-native';
import { Input } from './input';
import { Icon } from './icon';
import { colors, spacing } from '../../constants/theme';

interface SearchBarProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {}

export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderVariant="secondary"
      variant="filled"
      leftIcon={<Icon name="search" size={18} color={colors.textSecondary} />}
      containerStyle={{
        borderRadius: 999,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        minHeight: 46,
      }}
    />
  );
}
