import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { ActivityIcon } from '../icons/activityIcon';
import { colors, radius, spacing } from '../../constants/theme';
import { getRoutineLocationSummary } from '../../store/routineBuilderStore';
import type { RoutineSummary } from '../../types/routine';
import { useTranslation } from 'react-i18next';

interface RoutinePickerCardProps {
  routine: RoutineSummary;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

interface CreateRoutinePickerCardProps {
  onPress: () => void;
  label?: string;
}

function RoutineCardShell({
  children,
  onPress,
  selected = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function RoutinePickerCard({ routine, selected, onSelect, onOpen }: RoutinePickerCardProps) {
  const { t } = useTranslation();
  const locationAndCount = `${getRoutineLocationSummary(routine.exercises)} · ${t('routineSelect.card.exercisesCount', { count: routine.exercises.length })}`;

  return (
    <RoutineCardShell onPress={onSelect} selected={selected}>
      <Row align="center" gap="sm" style={styles.titleRow}>
        <View style={styles.leftIconWrap}>
          {routine.primaryActivity ? (
            <ActivityIcon type={routine.primaryActivity} size="md" variant="plain" />
          ) : null}
        </View>

        <View style={styles.centerTextColumn}>
          <Text variant="header" tone="primary" style={styles.routineName} numberOfLines={1}>
            {routine.name}
          </Text>

          <Text variant="caption" numberOfLines={1} ellipsizeMode="tail" style={styles.metaText}>
            {locationAndCount}
          </Text>
        </View>

        <View style={styles.rightActions}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            style={({ pressed }) => [styles.chevronButton, pressed && styles.pressed]}
            hitSlop={10}
          >
            <Icon name="chevron-forward" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </Row>
    </RoutineCardShell>
  );
}

export function CreateRoutinePickerCard({ onPress, label }: CreateRoutinePickerCardProps) {
  return (
    <RoutineCardShell onPress={onPress}>
      <View style={styles.createCardContent}>
        <Icon name="add" size={28} color={colors.textPrimary} />
        {label ? (
          <Text variant="label" style={styles.createCardLabel}>{label}</Text>
        ) : null}
      </View>
    </RoutineCardShell>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 88,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'transparent',
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  titleRow: {
    width: '100%',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  leftIconWrap: {
    width: 38,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextColumn: {
    flex: 1,
    minHeight: 56,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  routineName: {
    fontSize: 18,
    lineHeight: 22,
  },
  metaText: {
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  rightActions: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  createCardContent: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  createCardLabel: {
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  chevronButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.84,
  },
});