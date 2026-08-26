import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Row } from '../../layout/row';
import { Text } from '../../ui/text';
import { Icon } from '../../ui/icon';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { getRoutineLocationSummary } from '../../../store/routineBuilderStore';
import type { RoutineSummary } from '../../../types/routine';
import { useTranslation } from 'react-i18next';

interface RoutinePickerCardProps {
  routine: RoutineSummary;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

function CardShell({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

// List-row card, per design system → Components → Card variants: `surface`
// bg, `medium` radius, `base` horizontal / `md` vertical padding. Selection
// is a `primary` border (not a fill — `primary` is a spotlight, not a
// surface) plus a filled radio dot, matching the wireframe exactly.
export function RoutinePickerCard({ routine, selected, onSelect, onOpen }: RoutinePickerCardProps) {
  const { t } = useTranslation();
  const metaText = `${t('routineSelect.card.exercisesCount', { count: routine.exercises.length })} · ${getRoutineLocationSummary(routine.exercises)}`;

  return (
    <CardShell onPress={onSelect} style={[styles.card, selected && styles.cardSelected]}>
      <Row align="center" gap="md">
        <View style={styles.textColumn}>
          <Text variant="body" weight="bold" numberOfLines={1}>{routine.name}</Text>
          <Text variant="caption" tone="secondary" numberOfLines={1} ellipsizeMode="tail">
            {metaText}
          </Text>
        </View>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          hitSlop={10}
          style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
        >
          <Icon name="chevron-forward-outline" size={16} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        </Pressable>

        <View style={[styles.radio, selected && styles.radioSelected]} />
      </Row>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.medium,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  openButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.big,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
  },
  radioSelected: {
    borderWidth: 0,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.84,
  },
});
