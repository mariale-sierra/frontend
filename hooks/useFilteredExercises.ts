import { useMemo } from 'react';
import { CATEGORY_TO_ACTIVITY, type FilterMode } from '../constants/challengeFilters';
import type { ActivityType } from '../constants/theme';
import type { ExerciseEntry } from '../store/routineBuilderStore';

export type ExerciseCandidate = Omit<ExerciseEntry, 'metrics' | 'note'>;

interface UseFilteredExercisesParams {
  exercises: ExerciseCandidate[];
  query: string;
  filterMode: FilterMode;
  selectedCategories: string[];
  selectedLocations: string[];
}

function isActivityType(value: ActivityType | undefined): value is ActivityType {
  return Boolean(value);
}

export function useFilteredExercises({
  exercises,
  query,
  filterMode,
  selectedCategories,
  selectedLocations,
}: UseFilteredExercisesParams) {
  return useMemo(() => {
    const queryValue = query.trim().toLowerCase();
    const allowedActivities = selectedCategories
      .map((value) => CATEGORY_TO_ACTIVITY[value])
      .filter(isActivityType);

    const shouldApplyCategoryFilter = filterMode !== 'location';
    const shouldApplyLocationFilter = filterMode !== 'category';

    return exercises.filter((exercise) => {
      const matchesQuery = exercise.name.toLowerCase().includes(queryValue);
      const matchesCategory = !shouldApplyCategoryFilter
        || allowedActivities.length === 0
        || allowedActivities.includes(exercise.activityType);
      const matchesLocation = !shouldApplyLocationFilter
        || selectedLocations.length === 0
        || selectedLocations.some((location) => exercise.location.toLowerCase().includes(location.toLowerCase()));

      return matchesQuery && matchesCategory && matchesLocation;
    });
  }, [exercises, query, filterMode, selectedCategories, selectedLocations]);
}
