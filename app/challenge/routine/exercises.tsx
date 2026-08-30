import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { SearchBar } from '../../../components/ui/searchBar';
import { CreateFlowPrimaryButton } from '../../../components/challenge/create';
import { FilterToggleButton, ExerciseListItem } from '../../../components/routine';
import { useRoutineBuilder } from '../../../store/routineBuilderStore';
import { useChallengeBuilder } from '../../../store/challengeBuilderStore';
import { colors, spacing, activityColors } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ExerciseCandidate } from '../../../hooks/useFilteredExercises';
import { getExercises, getExerciseFull } from '../../../services/exercises/exercises.service';
import type { ExerciseMetricConfig } from '../../../services/exercises/exercises.service';
import type { ActivityType } from '../../../types/activity';
import { CATEGORY_TO_ACTIVITY } from '../../../constants/challengeFilters';

interface BackendExercise {
  id: number;
  name: string;
  category?: string | null;
  location?: string | null;
  tracking_mode?: string;
  muscle_groups?: string[];
}

function mapBackendExerciseToCandidate(exercise: BackendExercise, defaultLocationLabel: string): ExerciseCandidate {
  const activityType: ActivityType =
    (exercise.category && CATEGORY_TO_ACTIVITY[exercise.category]) || 'strength';
  const metricType: ExerciseCandidate['metricType'] =
    exercise.tracking_mode === 'sets' ? 'strength' : 'schema';

  return {
    id: String(exercise.id),
    name: exercise.name,
    location: exercise.location ?? defaultLocationLabel,
    metricType,
    activityType,
    muscleGroups: exercise.muscle_groups ?? [],
  };
}

/** Converts GET /exercises/:id/full's real per-exercise `metrics[]` into the
 * raw shape `routineBuilderStore`'s `applyBackendMetricTemplate` already
 * validates and consumes — that hook existed but was never actually called
 * anywhere, so every non-'sets' exercise (cardio, flexibility, mind-body,
 * "single"-mode exercises like Guided Breathwork) got a hardcoded
 * distance+duration template regardless of what it actually tracks (real bug,
 * confirmed 2026-08-29: a pure-breathwork exercise showed distance/duration
 * fields). Only 'int'/'decimal' (-> a `number` field) and 'seconds' (-> a
 * `duration` field) map to anything the schema template UI can render today;
 * 'text'/'boolean' metrics are skipped rather than guessed. Returns null when
 * no metric maps to a renderable field, so the caller can fall back to the
 * existing mock rather than apply an empty template. */
function buildMetricTemplateFromExerciseMetrics(exerciseId: number, metrics: ExerciseMetricConfig[]): unknown | null {
  const fields = metrics
    .map((metric) => {
      if (metric.valueType === 'seconds') {
        return { key: metric.code, label: metric.name, type: 'duration' as const, defaultMinutes: 10, defaultSeconds: 0 };
      }
      if (metric.valueType === 'int' || metric.valueType === 'decimal') {
        return {
          key: metric.code,
          label: metric.name,
          type: 'number' as const,
          defaultValue: 10,
          unit: metric.defaultUnit ?? undefined,
          min: 0,
        };
      }
      return null;
    })
    .filter((field): field is NonNullable<typeof field> => field !== null);

  if (fields.length === 0) return null;

  return { id: `exercise-${exerciseId}-metrics`, title: 'Exercise metrics', fields };
}

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day: string }>();
  const addExercise = useRoutineBuilder((state) => state.addExercise);
  const applyBackendMetricTemplate = useRoutineBuilder((state) => state.applyBackendMetricTemplate);
  const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
  const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);

  const [allExercises, setAllExercises] = useState<ExerciseCandidate[]>([]);
  const [categoryByExerciseId, setCategoryByExerciseId] = useState<Record<string, string>>({});
  const [locationByExerciseId, setLocationByExerciseId] = useState<Record<string, string>>({});
  const [backendIdByLocalId, setBackendIdByLocalId] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dayNumber = Number(day ?? '1');

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        const data: BackendExercise[] = await getExercises();
        if (cancelled) return;

        const candidates = data.map((exercise) => mapBackendExerciseToCandidate(exercise, t('routineExercises.anywhere')));
        const idMap: Record<string, number> = {};
        const categoryMap: Record<string, string> = {};
        // Raw backend location string, untouched by i18n — mirrors
        // categoryMap's own pattern, needed to filter against
        // `selectedLocations` (real `exercise_locations.name` values), which
        // the translated `ExerciseCandidate.location` fallback can't reliably
        // match (see matchesAllowedLocation's own doc comment below).
        const locationMap: Record<string, string> = {};
        data.forEach((exercise) => {
          idMap[String(exercise.id)] = exercise.id;
          if (exercise.category) categoryMap[String(exercise.id)] = exercise.category;
          if (exercise.location) locationMap[String(exercise.id)] = exercise.location;
        });

        setAllExercises(candidates);
        setBackendIdByLocalId(idMap);
        setCategoryByExerciseId(categoryMap);
        setLocationByExerciseId(locationMap);
      } catch (error: any) {
        if (cancelled) return;
        console.error('[Exercises] Failed to load:', error?.response?.data ?? error?.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadExercises();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Restrict to the activity categories chosen in the challenge's own
  // Activity & Location step — that's the whole point of that step existing
  // (previously had zero effect here, real bug: every catalog exercise was
  // offered regardless of what the challenge creator selected). Empty
  // `selectedCategories` (shouldn't happen — that step requires at least
  // one) falls back to allowing everything rather than showing nothing.
  const allowedCategories = useMemo(() => new Set(selectedCategories), [selectedCategories]);

  // Real bug, fixed 2026-08-29, per explicit report: the location pills on
  // the challenge's own Activity & Location step had zero effect here — only
  // categories actually filtered the catalog, even though the wireframe
  // treats both as filters. `exercise.location` can be a single backend
  // `exercise_locations.name` ("Gym") or, for a custom multi-location
  // exercise created via ensureExerciseLocation's free-text join, a
  // " / "-joined combo ("Home / Outdoor") — split and check for ANY overlap
  // with what the challenge allows, not an exact string match.
  //
  // Deliberately NOT special-casing "Anywhere" to always pass — matches
  // GET /exercises/count's own strict `LOWER(el.name) IN (...)` membership
  // check (exercises.service.ts's countMatchingExercises) exactly, so the
  // "N exercises unlocked" count shown on the challenge's own Activity &
  // Location step can never disagree with what actually shows up here. If
  // "Anywhere" should count as a wildcard, that needs to change on both ends
  // together — doing it only here would just trade one count/list mismatch
  // for another.
  const allowedLocations = useMemo(() => new Set(selectedLocations), [selectedLocations]);

  function matchesAllowedLocation(exerciseId: string): boolean {
    if (allowedLocations.size === 0) return true;
    const raw = locationByExerciseId[exerciseId];
    if (!raw) return true;
    const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
    return parts.some((part) => allowedLocations.has(part));
  }

  // Real category names present in the catalog (e.g. "Strength", "Cardio
  // Intense") — not the wireframe's literal "Legs & glutes"/"Push" pills,
  // which don't correspond to any category or muscle-group taxonomy the
  // backend actually has (`exercise_categories` only has 6 broad rows —
  // Strength/Cardio Intense/Cardio Low/Flexibility/Mind-Body/Functional).
  // Real data instead of fabricated category names, same substitution
  // pattern already used for the Create-Challenge flow's day-row meta line.
  // Further narrowed to the challenge's own selected categories, same rule
  // as `filtered` below.
  const categories = useMemo(() => {
    const present = Array.from(new Set(Object.values(categoryByExerciseId)));
    const scoped = allowedCategories.size === 0 ? present : present.filter((c) => allowedCategories.has(c));
    return scoped.sort();
  }, [categoryByExerciseId, allowedCategories]);

  const filtered = useMemo(() => {
    const queryValue = query.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      const exerciseCategory = categoryByExerciseId[exercise.id];
      const matchesQuery = exercise.name.toLowerCase().includes(queryValue);
      const matchesCategory = !activeCategory || exerciseCategory === activeCategory;
      const matchesAllowedCategory = allowedCategories.size === 0 || allowedCategories.has(exerciseCategory);
      return matchesQuery && matchesCategory && matchesAllowedCategory && matchesAllowedLocation(exercise.id);
    });
  }, [allExercises, query, activeCategory, categoryByExerciseId, allowedCategories, allowedLocations, locationByExerciseId]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAddSelected() {
    if (selectedIds.size === 0) return;

    const toAdd = allExercises.filter((exercise) => selectedIds.has(exercise.id));

    for (const exercise of toAdd) {
      const backendId = backendIdByLocalId[exercise.id];
      addExercise(exercise, backendId);

      // 'strength' exercises already get a correct sets/reps editor from
      // addExercise() itself — only 'schema' ones need real metric data to
      // replace the hardcoded distance+duration mock (see
      // buildMetricTemplateFromExerciseMetrics's doc comment above).
      if (exercise.metricType !== 'schema' || backendId == null) continue;

      try {
        const full = await getExerciseFull(backendId);
        const template = buildMetricTemplateFromExerciseMetrics(backendId, full.metrics);
        if (template) {
          applyBackendMetricTemplate(exercise.id, template);
        }
      } catch (error: any) {
        // Falls back to whatever addExercise() already applied (the mock
        // template) rather than blocking the whole add flow over one
        // exercise's metric lookup failing.
        console.error('[Exercises] Failed to load real metric config for', exercise.name, error?.response?.data ?? error?.message);
      }
    }

    router.back();
  }

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} onPress={() => router.back()} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('routineExercises.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('routineExercises.searchPlaceholder')} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
        style={styles.pillRowWrap}
      >
        <FilterToggleButton
          label={t('routineExercises.categoryAll')}
          isActive={activeCategory === null}
          onPress={() => setActiveCategory(null)}
        />
        {categories.map((category) => {
          const activityType = CATEGORY_TO_ACTIVITY[category];
          return (
            <FilterToggleButton
              key={category}
              label={category}
              isActive={activeCategory === category}
              onPress={() => setActiveCategory(category)}
              activeColor={activityType ? activityColors[activityType] : undefined}
            />
          );
        })}
      </ScrollView>

      <Row justify="space-between" align="center" style={styles.countRow}>
        <Text variant="header" tone="secondary" size="xs">
          {t('routineExercises.resultsCount', { count: filtered.length })}
        </Text>
        <Text variant="caption" tone="secondary">{t('routineExercises.tapToAdd')}</Text>
      </Row>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          renderItem={({ item }) => (
            <ExerciseListItem
              name={item.name}
              meta={`${categoryByExerciseId[item.id] ?? ''} · ${item.location}`}
              selected={selectedIds.has(item.id)}
              onPress={() => toggleSelected(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text variant="body" tone="secondary">{t('routineExercises.empty')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <CreateFlowPrimaryButton
          onPress={handleAddSelected}
          disabled={selectedIds.size === 0}
          label={t('routineExercises.addSelectedCta', { count: selectedIds.size })}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  trailingSpacer: {
    width: 44,
    height: 44,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  pillRowWrap: {
    flexGrow: 0,
  },
  pillRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
  loadingWrap: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
});
