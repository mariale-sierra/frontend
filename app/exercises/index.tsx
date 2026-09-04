import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { IconButton } from '../../components/ui/iconButton';
import { Text } from '../../components/ui/text';
import { SearchBar } from '../../components/ui/searchBar';
import { FilterToggleButton, ExerciseListItem } from '../../components/routine';
import { FilterSheet } from '../../components/exercises/filterSheet';
import { MuscleFilterSheet } from '../../components/exercises/muscleFilterSheet';
import { colors, spacing, activityColors } from '../../constants/theme';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { LocationIcon } from '../../components/icons/locationIcon';
import type { LocationType } from '../../components/icons/locationIcon';
import { getExerciseList, getExerciseCategories, type ExerciseCategory } from '../../services/exercises/exercises.service';
import { adaptExerciseListRow } from '../../services/adapters/exerciseAdapter';
import { CATEGORY_CODE_TO_ACTIVITY } from '../../constants/challengeFilters';

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
  const [activeMuscle, setActiveMuscle] = useState<{ code: string; label: string } | null>(null);
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
          muscle: activeMuscle?.code,
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
    [debouncedQuery, activeCategory, activeLocation, activeMuscle, locale],
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
      icon: activityType ? <ActivityIcon type={activityType} variant="plain" size="sm" color={colors.paper} /> : undefined,
    };
  });
  const locationOptions = LOCATION_CODES.map((code) => ({
    code,
    label: t(`exerciseCatalog.locations.${code}` as never),
    icon: <LocationIcon type={code} variant="plain" size="sm" color={colors.paper} />,
  }));

  const activeCategoryLabel = activeCategory ? t(`exerciseCatalog.categories.${activeCategory}` as never) : t('exerciseCatalog.filters.categories');
  const activeLocationLabel = activeLocation ? t(`exerciseCatalog.locations.${activeLocation}` as never) : t('exerciseCatalog.filters.locations');
  const activeCategoryColor = activeCategory && CATEGORY_CODE_TO_ACTIVITY[activeCategory] ? activityColors[CATEGORY_CODE_TO_ACTIVITY[activeCategory]] : undefined;

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
          combined panel. Each opens its own sheet. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterRowWrap}>
        <FilterToggleButton
          label={activeCategoryLabel}
          isActive={activeCategory !== null}
          onPress={() => setSheet('categories')}
          activeColor={activeCategoryColor}
        />
        <FilterToggleButton
          label={activeLocationLabel}
          isActive={activeLocation !== null}
          onPress={() => setSheet('locations')}
        />
        <FilterToggleButton
          label={activeMuscle?.label ?? t('exerciseCatalog.filters.muscles')}
          isActive={activeMuscle !== null}
          onPress={() => setSheet('muscles')}
        />
      </ScrollView>

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
        selectedCode={activeMuscle?.code ?? null}
        selectedLabel={activeMuscle?.label ?? null}
        onSelect={(code, label) => {
          setActiveMuscle(code && label ? { code, label } : null);
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
  filterRowWrap: {
    flexGrow: 0,
  },
  filterRow: {
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
});
