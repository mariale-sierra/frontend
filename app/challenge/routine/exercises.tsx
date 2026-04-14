import { useState } from 'react';
import { FlatList, StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { Input } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { ExerciseListItem } from '../../../components/routine/exerciseListItem';
import { FilterToggleButton } from '../../../components/routine/filterToggleButton';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { colors, spacing } from '../../../constants/theme';
import { EXERCISE_FILTERS, type FilterMode } from '../../../constants/challengeFilters';
import { useFilteredExercises, type ExerciseCandidate } from '../../../hooks/useFilteredExercises';

//fake exercises until we have an API

const MOCK_EXERCISES: ExerciseCandidate[] = [
  { id: 'e1', name: 'BULGARIAN DEADLIFTS', location: 'Home / Gym', metricType: 'strength', activityType: 'strength' },
  { id: 'e2', name: 'LEG PRESS', location: 'Gym', metricType: 'strength', activityType: 'strength' },
  { id: 'e3', name: 'PLANK', location: 'Anywhere', metricType: 'duration', activityType: 'functional' },
  { id: 'e4', name: 'CRUNCHES', location: 'Anywhere', metricType: 'strength', activityType: 'functional' },
  { id: 'e5', name: 'HIP THRUST', location: 'Gym', metricType: 'strength', activityType: 'strength' },
  { id: 'e6', name: 'RUNNING', location: 'Outdoor', metricType: 'distance-duration', activityType: 'cardioIntense' },
];

export default function ExercisesScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const addExercise = useRoutineBuilder((state) => state.addExercise);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>(null);

  function handleAdd(exercise: ExerciseCandidate) {
    addExercise(exercise);
    router.back();
  }

  const filtered = useFilteredExercises({
    exercises: MOCK_EXERCISES,
    query,
    filterMode,
    selectedCategories,
    selectedLocations,
  });

  function toggleFilter(mode: FilterMode) {
    setFilterMode((prev) => (prev === mode ? null : mode));
  }

  return (
    <ScreenBackground variant="top">
      {/* Header */}
      <Row align="center" gap="md" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="subheader">DAY {day ?? '1'} EXERCISES</Text>
      </Row>

      {/* Search + Filter controls */}
      <View style={styles.controls}>
        <Input
          value={query}
          onChangeText={setQuery}
          variant="filled"
          leftIcon={<Icon name="search" size={18} color={colors.textSecondary} />}
        />

        <Row justify="center" gap="sm" style={styles.filters}>
          {EXERCISE_FILTERS.map((filter) => (
            <FilterToggleButton
              key={filter.key}
              label={filter.label}
              isActive={filterMode === filter.key}
              onPress={() => toggleFilter(filter.key)}
            />
          ))}
        </Row>
      </View>

      {/* Exercise list — no horizontal padding so dividers span full width */}
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
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filters: {
    width: '100%',
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
