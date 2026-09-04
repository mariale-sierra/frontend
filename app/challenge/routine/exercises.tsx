import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  getExerciseList,
  getExerciseFull,
  getExerciseCategories,
} from '../../../services/exercises/exercises.service';
import type {
  ExerciseMetricConfig,
  ExerciseListRow,
  ExerciseCategory,
} from '../../../services/exercises/exercises.service';
import type { ActivityType } from '../../../types/activity';
import { CATEGORY_TO_ACTIVITY } from '../../../constants/challengeFilters';
import { LOCATION_OPTIONS } from '../../../constants/challengeCreateOptions';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Real backend location codes for the challenge builder's own selected display names
// (e.g. "Gym" -> "gym") — LOCATION_OPTIONS is the same constant the Activity & Location
// step itself renders its pills from, so there's no separate source of truth to drift.
const LOCATION_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  LOCATION_OPTIONS.map((option) => [option.value, option.type]),
);

interface ExerciseRowCandidate extends ExerciseCandidate {
  imageUrl: string | null;
  meta: string;
}

function toCandidate(row: ExerciseListRow, defaultLocationLabel: string): ExerciseRowCandidate {
  const categoryName = row.category?.name;
  const activityType: ActivityType = (categoryName && CATEGORY_TO_ACTIVITY[categoryName]) || 'strength';
  const metricType: ExerciseCandidate['metricType'] = row.trackingMode === 'sets' ? 'strength' : 'schema';
  const locationLabel = row.locations.length ? row.locations.map((l) => l.name).join(' / ') : defaultLocationLabel;

  return {
    id: String(row.id),
    name: row.name,
    location: locationLabel,
    metricType,
    activityType,
    muscleGroups: [],
    imageUrl: row.imageUrl,
    meta: `${categoryName ?? ''} · ${locationLabel}`,
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

  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<ExerciseRowCandidate[]>([]);
  const [backendIdByLocalId, setBackendIdByLocalId] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dayNumber = Number(day ?? '1');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    getExerciseCategories()
      .then(setCategories)
      .catch((error: any) => console.error('[Exercises] categories', error?.message));
  }, []);

  // Real exercise_categories.code, keyed by the same display name this screen already
  // carries around everywhere else (selectedCategories, activeCategory, pill labels).
  const categoryNameToCode = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.name, c.code])),
    [categories],
  );

  // Restrict to the activity categories chosen in the challenge's own Activity &
  // Location step — that's the whole point of that step existing. Empty
  // `selectedCategories` (shouldn't happen — that step requires at least one) falls
  // back to allowing everything rather than showing nothing.
  const allowedCategoryCodes = useMemo(
    () => selectedCategories.map((name) => categoryNameToCode[name]).filter((code): code is string => Boolean(code)),
    [selectedCategories, categoryNameToCode],
  );

  // Same for locations — real codes now (exercise_locations.code), matched server-side
  // via a normal EXISTS/IN join instead of the old client-side "/"-split string
  // matching. That old approach was fragile (had a real bug history, see the
  // pre-2026-09-04 version of this file); filtering by code is exact.
  const allowedLocationCodes = useMemo(
    () => selectedLocations.map((name) => LOCATION_NAME_TO_CODE[name]).filter((code): code is string => Boolean(code)),
    [selectedLocations],
  );

  // Pills shown: the challenge's own allowed categories when it scoped any, else every
  // real category — same real display names as before (Strength, Cardio Intense, ...).
  const categoryOptions = useMemo(
    () => (selectedCategories.length > 0 ? selectedCategories : categories.map((c) => c.name)),
    [selectedCategories, categories],
  );

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (replace) setIsLoading(true);
      else setLoadingMore(true);
      try {
        const activeCategoryCode = activeCategory ? categoryNameToCode[activeCategory] : undefined;
        const categoryParam = activeCategoryCode ?? (allowedCategoryCodes.length ? allowedCategoryCodes.join(',') : undefined);
        const locationParam = allowedLocationCodes.length ? allowedLocationCodes.join(',') : undefined;

        const result = await getExerciseList({
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          search: debouncedQuery || undefined,
          category: categoryParam,
          location: locationParam,
        });

        const defaultLocationLabel = t('routineExercises.anywhere');
        const candidates = result.data.map((row) => toCandidate(row, defaultLocationLabel));

        setRows((current) => (replace ? candidates : [...current, ...candidates]));
        setTotal(result.total);
        setPage(pageToLoad);
        setBackendIdByLocalId((current) => {
          const next = replace ? {} : { ...current };
          result.data.forEach((row) => {
            next[String(row.id)] = row.id;
          });
          return next;
        });
      } catch (error: any) {
        console.error('[Exercises] Failed to load:', error?.response?.data ?? error?.message);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, activeCategory, allowedCategoryCodes, allowedLocationCodes, categoryNameToCode, t],
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  function handleEndReached() {
    if (loadingMore || isLoading) return;
    if (rows.length >= total) return;
    loadPage(page + 1, false);
  }

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

    const toAdd = rows.filter((exercise) => selectedIds.has(exercise.id));

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
        <BackButton style={styles.backButton} />
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
        {categoryOptions.map((category) => {
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
          {t('routineExercises.resultsCount', { count: total })}
        </Text>
        <Text variant="caption" tone="secondary">{t('routineExercises.tapToAdd')}</Text>
      </Row>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          renderItem={({ item }) => (
            <ExerciseListItem
              name={item.name}
              meta={item.meta}
              imageUrl={item.imageUrl}
              selected={selectedIds.has(item.id)}
              onPress={() => toggleSelected(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoading} /> : null}
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
  footerLoading: {
    paddingVertical: spacing.md,
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
