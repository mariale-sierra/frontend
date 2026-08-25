import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

export interface SelectablePillOption {
  label: string;
  value: string;
}

interface OptionPillGridProps<TOption extends SelectablePillOption> {
  label: string;
  options: readonly TOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  renderIcon: (option: TOption, selected: boolean) => ReactNode;
}

/** Flex-wrap pill selector — icon + label, selected = primary fill / ink text, unselected = surface / paper text. No per-category color (see design system → Explicitly Rejected Patterns). */
export function OptionPillGrid<TOption extends SelectablePillOption>({
  label,
  options,
  selectedValues,
  onToggle,
  renderIcon,
}: OptionPillGridProps<TOption>) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Row justify="space-between" align="flex-end">
        <Text variant="header" tone="secondary">{label}</Text>
        <Text variant="caption" tone="secondary">
          {t('challengeCreate.fields.selectedCount', { count: selectedValues.length })}
        </Text>
      </Row>

      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]}
            >
              {renderIcon(option, selected)}
              <Text variant="label" tone={selected ? 'inverse' : 'primary'} weight={selected ? 'bold' : 'medium'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
