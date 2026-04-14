import { useMemo } from 'react';
import { CATEGORY_TO_ACTIVITY } from '../constants/challengeFilters';
import type { ActivityType } from '../constants/theme';
import type { ExerciseEntry } from '../store/routineBuilderStore';

export type ExerciseCandidate = Omit<ExerciseEntry, 'metrics' | 'note'>;

interface UseFilteredExercisesParams {
  exercises: ExerciseCandidate[];
  query: string;
  selectedCategories: string[];
  selectedLocations: string[];
  selectedMuscleGroup?: string | null;
}

function isActivityType(value: ActivityType | undefined): value is ActivityType {
  return Boolean(value);
}

export function useFilteredExercises({
  exercises,
  query,
  selectedCategories,
  selectedLocations,
  selectedMuscleGroup,
}: UseFilteredExercisesParams) {
  return useMemo(() => {
    const queryValue = query.trim().toLowerCase();
    const allowedActivities = selectedCategories
      .map((value) => CATEGORY_TO_ACTIVITY[value])
      .filter(isActivityType);

    return exercises.filter((exercise) => {
      const matchesQuery = exercise.name.toLowerCase().includes(queryValue);
      const matchesCategory =
        allowedActivities.length === 0 || allowedActivities.includes(exercise.activityType);
      const matchesLocation =
        selectedLocations.length === 0 ||
        selectedLocations.some((location) =>
          exercise.location.toLowerCase().includes(location.toLowerCase()),
        );
      const matchesMuscle =
        !selectedMuscleGroup || exercise.muscleGroups.includes(selectedMuscleGroup);

      return matchesQuery && matchesCategory && matchesLocation && matchesMuscle;
    });
  }, [exercises, query, selectedCategories, selectedLocations, selectedMuscleGroup]);
}
