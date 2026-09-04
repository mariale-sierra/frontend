import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../../constants/theme';
import { Text } from '../../ui/text';

interface FilterToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  /** Active-pill fill — defaults to `colors.primary`. Pass a category's own
   * known activity color (Activity Color System v2: `activityColors[type]`,
   * via `CATEGORY_TO_ACTIVITY`) for a per-category filter pill — each pill
   * IS its category, no "which one wins" question to answer, unlike a
   * challenge/routine's computed dominant color. Leave unset for the "All"
   * pill, which isn't tied to one category. */
  activeColor?: string;
  /** Leading icon — already colored by the caller (matches the active/inactive
   * text tone, or a specific category/location's own color when selected). */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Category filter pill (Add-Exercises screen) — `big` radius, filled/`ink`
 * bold when active (`primary` by default, see `activeColor`), `surface`/`paper`
 * medium when inactive. */
export function FilterToggleButton({ label, isActive, onPress, activeColor = colors.primary, icon, style }: FilterToggleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isActive && { backgroundColor: activeColor },
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon}
      <Text
        variant="label"
        size="sm"
        weight={isActive ? 'bold' : 'medium'}
        inverse={isActive}
        tone={isActive ? 'primary' : 'secondary'}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
