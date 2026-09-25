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
  /** Selected-pill fill color, per option — defaults to `colors.primary`.
   * Pass this for an activity-category grid (Activity Color System v2:
   * `(option) => activityColors[option.type]`) so each pill fills with its
   * OWN known category color on selection, not a computed dominant color —
   * unlike a challenge/routine's card accent, a category picker pill IS its
   * category, no "which one wins" question to answer. Leave unset for a
   * grid with no per-option color (e.g. the Location grid). */
  getSelectedFill?: (option: TOption) => string;
  /** Overrides the top-right "N selected" text — e.g. a picker with a hard
   * cap wants "N/6 selected" instead. Defaults to the plain
   * `challengeCreate.fields.selectedCount` count every existing caller
   * already shows, so this is purely additive — no existing grid changes. */
  countLabel?: (count: number) => string;
}

/** Flex-wrap pill selector — icon + label, selected = fill / ink text (see
 * `getSelectedFill`, defaults to `primary`), unselected = surface / paper text. */
export function OptionPillGrid<TOption extends SelectablePillOption>({
  label,
  options,
  selectedValues,
  onToggle,
  renderIcon,
  getSelectedFill,
  countLabel,
}: OptionPillGridProps<TOption>) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Row justify="space-between" align="flex-end">
        <Text variant="header" tone="secondary">{label}</Text>
        <Text variant="caption" tone="secondary">
          {countLabel
            ? countLabel(selectedValues.length)
            : t('challengeCreate.fields.selectedCount', { count: selectedValues.length })}
        </Text>
      </Row>

      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          const fill = getSelectedFill?.(option) ?? colors.primary;
          return (
            <Pressable
              key={option.value}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [styles.pill, selected && { backgroundColor: fill }, pressed && styles.pressed]}
            >
              {renderIcon(option, selected)}
              {/* Real bug, fixed 2026-09-24, per explicit "when you select a
                  badge the layout shifts" report: `weight` used to flip
                  medium->bold on selection — bold renders wider than medium
                  for the same string, so a pill's own width changed the
                  instant it got selected, which could reflow every pill
                  after it in this flex-wrap grid onto a different row.
                  Selection is already unambiguous via the fill color +
                  inverted text color below; the weight doesn't need to
                  change too, and keeping it constant means a pill's width
                  never changes on tap. */}
              <Text variant="label" tone={selected ? 'inverse' : 'primary'} weight="bold">
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
  pressed: {
    opacity: 0.85,
  },
});
