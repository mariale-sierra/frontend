import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenBackground from "../../../components/layout/screenBackground";
import { Row } from "../../../components/layout/row";
import { Input } from "../../../components/ui/input";
import { Text } from "../../../components/ui/text";
import { Icon } from "../../../components/ui/icon";
import { ExerciseListItem } from "../../../components/routine/exercise-picker/exerciseListItem";
import { MuscleGroupPickerModal } from "../../../components/routine/exercise-picker/MuscleGroupPickerModal";
import { AssignMuscleGroupsModal } from "../../../components/routine/exercise-picker/AssignMuscleGroupsModal";
import { useRoutineBuilder } from "../../../store/routineBuilderStore";
import { useChallengeBuilder } from "../../../store/challengeBuilderStore";
import { colors, spacing } from "../../../constants/theme";
import {
  useFilteredExercises,
  type ExerciseCandidate,
} from "../../../hooks/useFilteredExercises";
import { getExercises } from '../../../services/exercises/exercises.service';
import { CATEGORY_TO_ACTIVITY } from '../../../constants/challengeFilters';
import type { ActivityType } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';

interface BackendExercise {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  instructions?: string;
  icon_url?: string;
  tracking_mode?: string;
  is_active?: boolean;
  category?: string | null;
  location?: string | null;
  muscle_groups?: string[];
}

function mapBackendExerciseToCandidate(
  exercise: BackendExercise,
  defaultLocationLabel: string,
): ExerciseCandidate {
  const activityType: ActivityType =
    (exercise.category && CATEGORY_TO_ACTIVITY[exercise.category]) || 'strength';

  return {
    id: String(exercise.id),
    name: exercise.name.toUpperCase(),
    location: exercise.location ?? defaultLocationLabel,
    metricType: "strength",
    activityType,
    muscleGroups: exercise.muscle_groups ?? [],
  };
}

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const { day } = useLocalSearchParams<{ day: string }>();
  const addExercise = useRoutineBuilder((state) => state.addExercise);
  const selectedCategories = useChallengeBuilder(
    (state) => state.selectedCategories,
  );
  const selectedLocations = useChallengeBuilder(
    (state) => state.selectedLocations,
  );
  const [query, setQuery] = useState("");
  const [musclePickerVisible, setMusclePickerVisible] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<ExerciseCandidate | null>(null);
  const [exercises, setExercises] = useState<ExerciseCandidate[]>([]);
  const [backendIdByLocalId, setBackendIdByLocalId] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        const data: BackendExercise[] = await getExercises();
        if (cancelled) return;

        const candidates = data.map((exercise) => mapBackendExerciseToCandidate(
          exercise,
          t('routineExercises.anywhere'),
        ));
        const idMap: Record<string, number> = {};
        data.forEach((exercise) => {
          idMap[String(exercise.id)] = exercise.id;
        });

        setExercises(candidates);
        setBackendIdByLocalId(idMap);
      } catch (error: any) {
        if (cancelled) return;
        console.error(
          "[Exercises] Failed to load:",
          error?.response?.data ?? error?.message,
        );
        Alert.alert(
          t('routineExercises.alerts.loadFailedTitle'),
          error?.response?.data?.message ?? t('routineExercises.alerts.loadFailedFallback'),
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadExercises();
    return () => {
      cancelled = true;
    };
  }, [t]);

  function commitAdd(exercise: ExerciseCandidate) {
    const backendId = backendIdByLocalId[exercise.id];
    addExercise(exercise, backendId);
    router.back();
  }

  function handleAdd(exercise: ExerciseCandidate) {
    // Already tagged (from a previous submission) — no need to ask again.
    if (exercise.muscleGroups.length > 0) {
      commitAdd(exercise);
      return;
    }
    setPendingExercise(exercise);
  }

  function handleMuscleAssignConfirm(muscleGroups: string[]) {
    if (!pendingExercise) return;
    commitAdd({ ...pendingExercise, muscleGroups });
    setPendingExercise(null);
  }

  const filtered = useFilteredExercises({
    exercises,
    query,
    selectedCategories: [],
    selectedLocations: [],
  });

  return (
    <ScreenBackground variant="top">
      {/* Header */}
      <Row align="center" gap="md" style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="subheader">{t('routineExercises.dayExercisesTitle', { day: day ?? '1' })}</Text>
      </Row>

      {/* Search + muscle group filter */}
      <View style={styles.controls}>
        <Input
          value={query}
          onChangeText={setQuery}
          variant="filled"
          leftIcon={
            <Icon name="search" size={18} color={colors.textSecondary} />
          }
        />

        <View style={styles.filters}>
          <Pressable
            onPress={() => setMusclePickerVisible(true)}
            style={({ pressed }) => [
              styles.muscleBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text variant="caption" style={styles.muscleBtnText}>
              {t('routineExercises.allMuscles')}
            </Text>
            <Icon name="chevron-down" size={14} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : (
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
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text variant="body" tone="secondary">
                {t('routineExercises.empty')}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={styles.listFooterDivider} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <MuscleGroupPickerModal
        visible={musclePickerVisible}
        exercises={exercises}
        onClose={() => setMusclePickerVisible(false)}
        onAddExercise={handleAdd}
      />

      <AssignMuscleGroupsModal
        visible={pendingExercise !== null}
        exerciseName={pendingExercise?.name ?? ''}
        onClose={() => setPendingExercise(null)}
        onConfirm={handleMuscleAssignConfirm}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: "flex-start",
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
    alignItems: "center",
  },
  muscleBtn: {
    flexDirection: "row",
    alignItems: "center",
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
    paddingBottom: spacing["2xl"],
  },
  listFooterDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: spacing.xl,
  },
  loadingWrap: {
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  emptyWrap: {
    paddingTop: spacing.xl,
    alignItems: "center",
  },
});
