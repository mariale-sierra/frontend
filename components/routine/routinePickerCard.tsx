import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { ActivityIcon } from '../icons/activityIcon';
import { routineStyles } from './routineStyles';
import { colors, radius, spacing } from '../../constants/theme';
import { getRoutineLocationSummary, type RoutineSummary } from '../../store/routineBuilderStore';

interface RoutinePickerCardProps {
  routine: RoutineSummary;
  onPress: () => void;
  onSelect: () => void;
}

export function RoutinePickerCard({ routine, onPress, onSelect }: RoutinePickerCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.card}>
        <Row align="center" gap="sm" style={styles.titleRow}>
          {routine.primaryActivity ? (
            <ActivityIcon type={routine.primaryActivity} size="sm" variant="plain" />
          ) : null}
          <Text variant="subheader" style={styles.routineName} numberOfLines={1}>
            {routine.name}
          </Text>
          <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
        </Row>

        <View style={styles.meta}>
          <Text variant="caption" numberOfLines={1} ellipsizeMode="tail" style={styles.metaText}>
            {`${getRoutineLocationSummary(routine.exercises)} · ${routine.exercises.length} exercises`}
          </Text>
        </View>

        <View style={routineStyles.dividerLight} />

        <Pressable
          onPress={onSelect}
          style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed]}
        >
          <Text variant="label" style={styles.selectBtnText}>SELECT</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'transparent',
    padding: spacing.md,
    gap: spacing.sm,
  },
  titleRow: {
    justifyContent: 'flex-start',
  },
  routineName: {
    flex: 1,
    fontSize: 14,
  },
  meta: {
    minWidth: 0,
  },
  metaText: {
    color: colors.textSecondary,
  },
  selectBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  selectBtnPressed: {
    opacity: 0.8,
  },
  selectBtnText: {
    color: colors.textInverse,
    letterSpacing: 2,
  },
  pressed: {
    opacity: 0.82,
  },
});