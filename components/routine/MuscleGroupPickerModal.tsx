import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { ExerciseListItem } from './exerciseListItem';
import { useChallengeBuilder } from '../../store/challengeBuilderStore';
import { useFilteredExercises, type ExerciseCandidate } from '../../hooks/useFilteredExercises';
import { MUSCLE_GROUPS } from '../../constants/muscleGroups';
import { colors, radius, spacing } from '../../constants/theme';

interface MuscleGroupPickerModalProps {
  visible: boolean;
  exercises: ExerciseCandidate[];
  onClose: () => void;
  onAddExercise: (exercise: ExerciseCandidate) => void;
}

export function MuscleGroupPickerModal({
  visible,
  exercises,
  onClose,
  onAddExercise,
}: MuscleGroupPickerModalProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);

  // Base: exercises filtered only by challenge activity + location — drives muscle group counts
  const baseFiltered = useFilteredExercises({
    exercises,
    query: '',
    selectedCategories,
    selectedLocations,
  });

  // Secondary: further filters by selected muscle group for exercise list view
  const muscleFiltered = useMemo(() => {
    if (!selectedMuscle) return baseFiltered;
    return baseFiltered.filter((e) => e.muscleGroups.includes(selectedMuscle));
  }, [baseFiltered, selectedMuscle]);

  const muscleGroupsWithCounts = useMemo(
    () =>
      MUSCLE_GROUPS.map((group) => ({
        group,
        count: baseFiltered.filter((e) => e.muscleGroups.includes(group)).length,
      })).filter(({ count }) => count > 0),
    [baseFiltered],
  );

  function handleClose() {
    setSelectedMuscle(null);
    onClose();
  }

  function handleAdd(exercise: ExerciseCandidate) {
    setSelectedMuscle(null);
    onAddExercise(exercise);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Inner Pressable stops backdrop tap from reaching the sheet */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            {selectedMuscle ? (
              <Pressable onPress={() => setSelectedMuscle(null)} hitSlop={12} style={styles.backBtn}>
                <Icon name="chevron-back" size={22} color={colors.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.backBtn} />
            )}

            <Text variant="subheader" style={styles.headerTitle}>
              {selectedMuscle ?? 'MUSCLES'}
            </Text>

            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* View 1 — Muscle group list */}
          {!selectedMuscle && (
            <FlatList
              data={muscleGroupsWithCounts}
              keyExtractor={({ group }) => group}
              renderItem={({ item: { group, count } }) => (
                <Pressable
                  onPress={() => setSelectedMuscle(group)}
                  style={({ pressed }) => [styles.muscleRow, pressed && styles.pressed]}
                >
                  <Text variant="body">{group}</Text>
                  <View style={styles.muscleRowRight}>
                    <Text variant="caption" style={styles.countText}>{count}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* View 2 — Exercises for selected muscle group */}
          {selectedMuscle && (
            <FlatList
              data={muscleFiltered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ExerciseListItem
                  name={item.name}
                  location={item.location}
                  activityType={item.activityType}
                  onAdd={() => handleAdd(item)}
                />
              )}
              ListEmptyComponent={
                <Text variant="caption" style={styles.emptyText}>
                  No exercises found for this muscle group.
                </Text>
              }
              ListFooterComponent={<View style={styles.listFooter} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
    paddingBottom: spacing['2xl'],
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: 32,
  },
  closeBtn: {
    width: 32,
    alignItems: 'flex-end',
  },
  muscleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  muscleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countText: {
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.md,
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  listContent: {
    paddingTop: spacing.xs,
  },
  listFooter: {
    height: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
