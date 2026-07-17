import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from '../../layout/stack';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

export interface SelectableOptionBase {
  label: string;
  value: string;
  description: string;
}

interface SelectionPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

interface OptionCardProps {
  label: string;
  selected: boolean;
  icon: ReactNode;
  onPress: () => void;
  onPressInfo: () => void;
}

function SelectionPanel({ title, subtitle, children }: SelectionPanelProps) {
  return (
    <Stack gap="md">
      <View>
        <Text variant="subheader">{title}</Text>
        <Text variant="body" tone="secondary" style={styles.selectionPanelSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </Stack>
  );
}

function OptionCard({ label, selected, icon, onPress, onPressInfo }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, selected && styles.optionCardSelected, pressed && styles.pressed]}
    >
      <Pressable
        hitSlop={10}
        onPress={(event) => {
          event.stopPropagation();
          onPressInfo();
        }}
        style={({ pressed }) => [styles.optionInfoButton, pressed && styles.pressed]}
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.optionContent}>
        {icon}
        <Text variant="body" style={styles.optionTitle}>{label}</Text>
      </View>
    </Pressable>
  );
}

export interface OptionSelectionPanelProps<TOption extends SelectableOptionBase> {
  title: string;
  subtitle: string;
  options: readonly TOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onPressInfo: (option: TOption) => void;
  renderIcon: (option: TOption, size: 'sm' | 'lg') => ReactNode;
}

export function OptionSelectionPanel<TOption extends SelectableOptionBase>({
  title,
  subtitle,
  options,
  selectedValues,
  onToggle,
  onPressInfo,
  renderIcon,
}: OptionSelectionPanelProps<TOption>) {
  return (
    <SelectionPanel title={title} subtitle={subtitle}>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <OptionCard
              key={option.value}
              label={option.label}
              selected={selected}
              icon={renderIcon(option, 'lg')}
              onPress={() => onToggle(option.value)}
              onPressInfo={() => onPressInfo(option)}
            />
          );
        })}
      </View>
    </SelectionPanel>
  );
}

const styles = StyleSheet.create({
  selectionPanelSubtitle: {
    marginTop: spacing.xs,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    width: '48%',
    minHeight: 150,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  optionContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  optionInfoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pressed: {
    opacity: 0.82,
  },
});
