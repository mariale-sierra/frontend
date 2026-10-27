import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { StreakGridItem, StreaksGridSkeleton } from '../../components/home';
import { getFollowingStreaks } from '../../services/follow/follow.service';
import { toFriendStreakViewModels, type FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { useImagesDrawn } from '../../hooks/useImagesDrawn';
import { queryKeys, staleTimes } from '../../services/cache/queries';
import { STREAK_GRID_COLUMNS } from '../../constants/streaksGrid';
import { spacing } from '../../constants/theme';
import { getStreakGridLayout } from '../../utils/streaksGrid';

type GridRow = FriendStreakViewModel | { userId: string; filler: true };

/** Grid rows rendered up front — the ones whose photos the skeleton waits for. */
const INITIAL_ROWS = 6;

/** Pads to a multiple of `STREAK_GRID_COLUMNS` so a partial last row still lines up
 * under the same flex columns as every full row above it. */
function padToGridColumns(entries: FriendStreakViewModel[]): GridRow[] {
  const remainder = entries.length % STREAK_GRID_COLUMNS;
  if (remainder === 0) return entries;
  const fillerCount = STREAK_GRID_COLUMNS - remainder;
  const fillers: GridRow[] = Array.from({ length: fillerCount }, (_, i) => ({
    userId: `filler-${i}`,
    filler: true,
  }));
  return [...entries, ...fillers];
}

export default function StreaksAllScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { avatarSize } = getStreakGridLayout(width);
  // Same cached entry as Home's streaks row: opening "See more" shows what
  // Home already loaded right away instead of a spinner and a second request.
  const streaksQuery = useCachedQuery(queryKeys.followingStreaks, getFollowingStreaks, {
    staleTime: staleTimes.social,
    persist: true,
  });
  const friends = useMemo(() => toFriendStreakViewModels(streaksQuery.data ?? []), [streaksQuery.data]);
  const loading = streaksQuery.isLoading;
  const error = !streaksQuery.data && Boolean(streaksQuery.error);
  const revalidate = streaksQuery.revalidate;
  useFocusEffect(
    useCallback(() => {
      void revalidate();
    }, [revalidate]),
  );

  const gridData = useMemo<GridRow[]>(() => {
    const sortedFriends = [...friends].sort((a, b) => b.streakDays - a.streakDays);
    return padToGridColumns(sortedFriends);
  }, [friends]);

  // Sprint 10: the grid stays a skeleton until the profile pictures on screen
  // are drawn, so they appear together (the real grid renders invisibly
  // underneath — see useImagesDrawn).
  const awaitedIds = useMemo(
    () =>
      gridData
        .slice(0, INITIAL_ROWS * STREAK_GRID_COLUMNS)
        .filter((item): item is FriendStreakViewModel => !('filler' in item) && !!item.avatarUrl)
        .map((item) => item.userId),
    [gridData],
  );
  const { ready: avatarsReady, onDrawn } = useImagesDrawn(awaitedIds, { enabled: !loading && !error });

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('streaksScreen.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          <StreaksGridSkeleton avatarSize={avatarSize} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text tone="secondary">{t('streaksScreen.errorMessage')}</Text>
        </View>
      ) : (
        <View style={styles.gridWrap}>
          <View
            style={[styles.gridWrap, !avatarsReady && styles.hidden]}
            pointerEvents={avatarsReady ? 'auto' : 'none'}
            accessibilityElementsHidden={!avatarsReady}
            importantForAccessibility={avatarsReady ? 'auto' : 'no-hide-descendants'}
          >
            <FlatList
              data={gridData}
              keyExtractor={(item) => item.userId}
              numColumns={STREAK_GRID_COLUMNS}
              initialNumToRender={INITIAL_ROWS}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <View style={styles.cell}>
                  {!('filler' in item) && (
                    <StreakGridItem
                      username={item.username}
                      avatarUrl={item.avatarUrl}
                      streakDays={item.streakDays}
                      loggedToday={item.loggedToday}
                      size={avatarSize}
                      onAvatarLoadEnd={() => onDrawn(item.userId)}
                    />
                  )}
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text tone="secondary">{t('streaksScreen.emptyMessage')}</Text>
                </View>
              }
            />
          </View>
          {!avatarsReady ? (
            <View style={[styles.skeletonWrap, styles.skeletonOverlay]} pointerEvents="none" testID="streaks-skeleton">
              <StreaksGridSkeleton avatarSize={avatarSize} />
            </View>
          ) : null}
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  gridWrap: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  skeletonWrap: {
    paddingHorizontal: spacing.lg,
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
