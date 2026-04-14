import { useState } from 'react';
import { FlatList, StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { Input } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { ExerciseListItem } from '../../../components/routine/exerciseListItem';
import { MuscleGroupPickerModal } from '../../../components/routine/MuscleGroupPickerModal';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { colors, spacing } from '../../../constants/theme';
import { useFilteredExercises, type ExerciseCandidate } from '../../../hooks/useFilteredExercises';

//fake exercises until we have an API

const MOCK_EXERCISES: ExerciseCandidate[] = [
  { id: 'e1', name: 'BULGARIAN DEADLIFTS', location: 'Home / Gym', metricType: 'strength', activityType: 'strength', muscleGroups: ['Glutes', 'Legs', 'Back'] },
  { id: 'e2', name: 'LEG PRESS', location: 'Gym', metricType: 'strength', activityType: 'strength', muscleGroups: ['Legs', 'Glutes'] },
  { id: 'e3', name: 'PLANK', location: 'Anywhere', metricType: 'duration', activityType: 'functional', muscleGroups: ['Core'] },
  { id: 'e4', name: 'CRUNCHES', location: 'Anywhere', metricType: 'strength', activityType: 'functional', muscleGroups: ['Core'] },
  { id: 'e5', name: 'HIP THRUST', location: 'Gym', metricType: 'strength', activityType: 'strength', muscleGroups: ['Glutes'] },
  { id: 'e6', name: 'RUNNING', location: 'Outdoor', metricType: 'distance-duration', activityType: 'cardioIntense', muscleGroups: ['Full Body', 'Legs'] },
];

export default function ExercisesScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const addExercise = useRoutineBuilder((state) => state.addExercise);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const [query, setQuery] = useState('');
  const [musclePickerVisible, setMusclePickerVisible] = useState(false);

  function handleAdd(exercise: ExerciseCandidate) {
    addExercise(exercise);
    router.back();
  }

  const filtered = useFilteredExercises({
    exercises: MOCK_EXERCISES,
    query,
    selectedCategories,
    selectedLocations,
  });

  return (
    <ScreenBackground variant="top">
      {/* Header */}
      <Row align="center" gap="md" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="subheader">DAY {day ?? '1'} EXERCISES</Text>
      </Row>

      {/* Search + muscle group filter */}
      <View style={styles.controls}>
        <Input
          value={query}
          onChangeText={setQuery}
          variant="filled"
          leftIcon={<Icon name="search" size={18} color={colors.textSecondary} />}
        />

        <View style={styles.filters}>
          <Pressable
            onPress={() => setMusclePickerVisible(true)}
            style={({ pressed }) => [styles.muscleBtn, pressed && styles.pressed]}
          >
            <Text variant="caption" style={styles.muscleBtnText}>ALL MUSCLES</Text>
            <Icon name="chevron-down" size={14} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Exercise list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseListItem
            name={item.name}
            location={item.location}
            activityType={item.activityType}
            onAdd={() => handleAdd(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListFooterComponent={<View style={styles.listFooterDivider} />}
        showsVerticalScrollIndicator={false}
      />

      <MuscleGroupPickerModal
        visible={musclePickerVisible}
        exercises={MOCK_EXERCISES}
        onClose={() => setMusclePickerVisible(false)}
        onAddExercise={handleAdd}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  backBtn: {
    padding: spacing.xs,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filters: {
    alignItems: 'center',
  },
  muscleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    backgroundColor: colors.background,
  },
  muscleBtnText: {
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  list: {
    paddingBottom: spacing['2xl'],
  },
  listFooterDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: spacing.xl,
  },
});

