import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { IconButton } from '../../components/ui/iconButton';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { SearchBar } from '../../components/ui/searchBar';
import { FilterToggleButton, ExerciseListItem } from '../../components/routine';
import { FilterSheet } from '../../components/exercises/filterSheet';
import { MuscleFilterSheet } from '../../components/exercises/muscleFilterSheet';
import type { MuscleFilterSelection } from '../../components/exercises/muscleFilterSheet';
import { colors, spacing, activityColors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { LocationIcon } from '../../components/icons/locationIcon';
import type { LocationType } from '../../components/icons/locationIcon';
import { getExerciseList, getExerciseCategories, type ExerciseCategory } from '../../services/exercises/exercises.service';
import { adaptExerciseListRow } from '../../services/adapters/exerciseAdapter';
import { CATEGORY_CODE_TO_ACTIVITY } from '../../constants/challengeFilters';

const INACTIVE_ICON_COLOR = withAlpha(colors.paper, textOpacity.secondary);

const LOCATION_CODES: LocationType[] = ['gym', 'home', 'outdoor', 'studio', 'anywhere'];
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function ExerciseCatalogScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('es') ? 'es' : 'en';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [activeMuscleFilter, setActiveMuscleFilter] = useState<MuscleFilterSelection | null>(null);
  const [sheet, setSheet] = useState<'categories' | 'locations' | 'muscles' | null>(null);

  const [rows, setRows] = useState<ReturnType<typeof adaptExerciseListRow>[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    getExerciseCategories()
      .then(setCategories)
      .catch((error: any) => console.error('[ExerciseCatalog] categories', error?.message));
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const result = await getExerciseList({
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          search: debouncedQuery || undefined,
          category: activeCategory ?? undefined,
          location: activeLocation ?? undefined,
          region: activeMuscleFilter?.level === 'region' ? activeMuscleFilter.code : undefined,
          muscle: activeMuscleFilter?.level === 'muscle' ? activeMuscleFilter.code : undefined,
          locale,
        });
        const adapted = result.data.map(adaptExerciseListRow);
        setRows((current) => (replace ? adapted : [...current, ...adapted]));
        setTotal(result.total);
        setPage(pageToLoad);
      } catch (error: any) {
        console.error('[ExerciseCatalog] load', error?.response?.data ?? error?.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, activeCategory, activeLocation, activeMuscleFilter, locale],
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  function handleEndReached() {
    if (loadingMore || loading) return;
    if (rows.length >= total) return;
    loadPage(page + 1, false);
  }

  const categoryOptions = categories.map((c) => {
    const activityType = CATEGORY_CODE_TO_ACTIVITY[c.code];
    return {
      code: c.code,
      label: t(`exerciseCatalog.categories.${c.code}` as never),
      // Each category keeps its own Activity Color System v2 color here — this
      // sheet is a legend of distinct categories, not a per-exercise badge, so
      // the "icon+name only, no per-category color" rule doesn't apply to it.
      icon: activityType ? <ActivityIcon type={activityType} variant="plain" size="sm" color={activityColors[activityType]} /> : undefined,
    };
  });
  const locationOptions = LOCATION_CODES.map((code) => ({
    code,
    label: t(`exerciseCatalog.locations.${code}` as never),
    icon: <LocationIcon type={code} variant="plain" size="sm" color={colors.paper} />,
  }));

  const activeCategoryLabel = activeCategory ? t(`exerciseCatalog.categories.${activeCategory}` as never) : t('exerciseCatalog.filters.categories');
  const activeLocationLabel = activeLocation ? t(`exerciseCatalog.locations.${activeLocation}` as never) : t('exerciseCatalog.filters.locations');
  const activeCategoryActivityType = activeCategory ? CATEGORY_CODE_TO_ACTIVITY[activeCategory] : undefined;
  const activeCategoryColor = activeCategoryActivityType ? activityColors[activeCategoryActivityType] : undefined;

  const categoryPillIcon = activeCategoryActivityType ? (
    <ActivityIcon type={activeCategoryActivityType} variant="plain" size="sm" color={colors.ink} />
  ) : (
    <Icon name="grid-outline" size={16} color={INACTIVE_ICON_COLOR} />
  );
  const locationPillIcon = activeLocation ? (
    <LocationIcon type={activeLocation as LocationType} variant="plain" size="sm" color={colors.ink} />
  ) : (
    <Icon name="navigate-outline" size={16} color={INACTIVE_ICON_COLOR} />
  );
  const musclePillIcon = (
    <Icon name="body-outline" size={16} color={activeMuscleFilter ? colors.ink : INACTIVE_ICON_COLOR} />
  );

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('exerciseCatalog.title')}
        </Text>
        <IconButton
          name="body-outline"
          iconSize={22}
          onPress={() => router.push('/exercises/muscles')}
          accessibilityRole="button"
          accessibilityLabel={t('exerciseCatalog.muscleBrowser.title')}
          hitSlop={10}
        />
      </Row>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('exerciseCatalog.searchPlaceholder')} />
      </View>

      {/* Three distinct filter accesses — categories / locations / muscles — never one
          combined panel. Each opens its own sheet. Content-aware flexible widths:
          each pill keeps the space its own label/icon needs, remaining row width
          is distributed between them via flex-grow — no fixed widths, no scroll. */}
      <View style={styles.filterRow}>
        <FilterToggleButton
          label={activeCategoryLabel}
          isActive={activeCategory !== null}
          onPress={() => setSheet('categories')}
          activeColor={activeCategoryColor}
          icon={categoryPillIcon}
          style={styles.filterButton}
        />
        <FilterToggleButton
          label={activeLocationLabel}
          isActive={activeLocation !== null}
          onPress={() => setSheet('locations')}
          icon={locationPillIcon}
          style={styles.filterButton}
        />
        <FilterToggleButton
          label={activeMuscleFilter?.label ?? t('exerciseCatalog.filters.muscles')}
          isActive={activeMuscleFilter !== null}
          onPress={() => setSheet('muscles')}
          icon={musclePillIcon}
          style={styles.filterButton}
        />
      </View>

      <Row justify="space-between" align="center" style={styles.countRow}>
        <Text variant="header" tone="secondary" size="xs">
          {t('exerciseCatalog.resultsCount', { count: total })}
        </Text>
      </Row>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          style={styles.listContainer}
          renderItem={({ item }) => (
            <ExerciseListItem
              name={item.name}
              meta={item.meta}
              imageUrl={item.imageUrl}
              selected={false}
              mode="navigate"
              onPress={() => router.push(`/exercises/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoading} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text variant="body" tone="secondary">{t('exerciseCatalog.empty')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterSheet
        visible={sheet === 'categories'}
        title={t('exerciseCatalog.filters.categories')}
        allLabel={t('exerciseCatalog.filters.all')}
        options={categoryOptions}
        selectedCode={activeCategory}
        onSelect={(code) => {
          setActiveCategory(code);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <FilterSheet
        visible={sheet === 'locations'}
        title={t('exerciseCatalog.filters.locations')}
        allLabel={t('exerciseCatalog.filters.all')}
        options={locationOptions}
        selectedCode={activeLocation}
        onSelect={(code) => {
          setActiveLocation(code);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <MuscleFilterSheet
        visible={sheet === 'muscles'}
        selected={activeMuscleFilter}
        onSelect={(selection) => {
          setActiveMuscleFilter(selection);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  filterButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
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
});
