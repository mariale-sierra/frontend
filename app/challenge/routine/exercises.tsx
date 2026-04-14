import { useState } from 'react';
import { FlatList, StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { Input } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { ExerciseListItem } from '../../../components/routine/exerciseListItem';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { colors, spacing, radius, ActivityType } from '../../../constants/theme';

const MOCK_EXERCISES = [
  { id: 'e1', name: 'BULGARIAN DEADLIFTS', location: 'Home / Gym', metricType: 'strength' as const, activityType: 'strength' as ActivityType },
  { id: 'e2', name: 'LEG PRESS', location: 'Gym', metricType: 'strength' as const, activityType: 'strength' as ActivityType },
  { id: 'e3', name: 'PLANK', location: 'Anywhere', metricType: 'duration' as const, activityType: 'functional' as ActivityType },
  { id: 'e4', name: 'CRUNCHES', location: 'Anywhere', metricType: 'strength' as const, activityType: 'functional' as ActivityType },
  { id: 'e5', name: 'HIP THRUST', location: 'Gym', metricType: 'strength' as const, activityType: 'strength' as ActivityType },
  { id: 'e6', name: 'RUNNING', location: 'Outdoor', metricType: 'distance-duration' as const, activityType: 'cardioIntense' as ActivityType },
];

type FilterMode = 'location' | 'category' | null;

const CATEGORY_TO_ACTIVITY: Record<string, ActivityType> = {
  Strength: 'strength',
  'Cardio Intense': 'cardioIntense',
  'Cardio Low': 'cardioLow',
  Flexibility: 'flexibility',
  'Mind-Body': 'mindBody',
  Functional: 'functional',
};

export default function ExercisesScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const addExercise = useRoutineBuilder((state) => state.addExercise);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>(null);

  function handleAdd(exercise: typeof MOCK_EXERCISES[number]) {
    addExercise({
      id: exercise.id,
      name: exercise.name,
      location: exercise.location,
      metricType: exercise.metricType,
      activityType: exercise.activityType,
    });
    router.back();
  }

  const allowedActivities = selectedCategories.map((value) => CATEGORY_TO_ACTIVITY[value]).filter(Boolean);

  const filtered = MOCK_EXERCISES.filter((exercise) => {
    const matchesQuery = exercise.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = allowedActivities.length === 0 || allowedActivities.includes(exercise.activityType);
    const matchesLocation = selectedLocations.length === 0
      || selectedLocations.some((location) => exercise.location.toLowerCase().includes(location.toLowerCase()));

    return matchesQuery && matchesCategory && matchesLocation;
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
          <Pressable
            onPress={() => toggleFilter('location')}
            style={({ pressed }) => [
              styles.filterBtn,
              filterMode === 'location' && styles.filterBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <Text variant="caption" style={[
              styles.filterBtnText,
              filterMode === 'location' && styles.filterBtnTextActive,
            ]}>
              BY LOCATION
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleFilter('category')}
            style={({ pressed }) => [
              styles.filterBtn,
              filterMode === 'category' && styles.filterBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <Text variant="caption" style={[
              styles.filterBtnText,
              filterMode === 'category' && styles.filterBtnTextActive,
            ]}>
              BY CATEGORY
            </Text>
          </Pressable>
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
  filterBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    backgroundColor: colors.background,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterBtnText: {
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  filterBtnTextActive: {
    color: colors.textInverse,
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
