import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

export interface FilterOption {
  code: string;
  label: string;
  /** Category options SIEMPRE render `<ActivityIcon>`, location options
   * SIEMPRE render `<LocationIcon>` — passed in per-option by the caller
   * (who knows which icon set applies) rather than hard-coded here. */
  icon?: ReactNode;
}

interface FilterSheetProps {
  visible: boolean;
  title: string;
  allLabel: string;
  options: FilterOption[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  onClose: () => void;
}

/** Bottom-anchored option sheet shared by the exercise catalog's category and
 * location filters — a distinct, separate access per filter dimension
 * (never one combined panel), each opening this same sheet with its own
 * option list. Single-select: tapping an option applies it and closes. */
export function FilterSheet({ visible, title, allLabel, options, selectedCode, onSelect, onClose }: FilterSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text variant="header" size="lg" weight="bold" style={styles.title}>
          {title}
        </Text>
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Row onPress={() => onSelect(null)} label={allLabel} selected={selectedCode === null} />
          {options.map((option) => (
            <Row
              key={option.code}
              onPress={() => onSelect(option.code)}
              label={option.label}
              icon={option.icon}
              selected={selectedCode === option.code}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ label, icon, selected, onPress }: { label: string; icon?: ReactNode; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={styles.rowLeft}>
        {icon}
        <Text variant="body" weight={selected ? 'bold' : 'regular'}>
          {label}
        </Text>
      </View>
      {selected && <Icon name="checkmark-outline" size={18} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.5),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    maxHeight: '70%',
    ...shadows.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowPressed: {
    opacity: 0.7,
  },
});
