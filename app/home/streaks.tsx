import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { StreakGridItem, StreaksGridSkeleton } from '../../components/home';
import { getFollowingStreaks } from '../../services/follow/follow.service';
import { toFriendStreakViewModels, type FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { STREAK_GRID_COLUMNS } from '../../constants/streaksGrid';
import { spacing } from '../../constants/theme';
import { getStreakGridLayout } from '../../utils/streaksGrid';

type GridRow = FriendStreakViewModel | { userId: string; filler: true };

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
  const [friends, setFriends] = useState<FriendStreakViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(false);

      getFollowingStreaks()
        .then((rows) => {
          if (!active) return;
          setFriends(toFriendStreakViewModels(rows));
        })
        .catch(() => {
          if (!active) return;
          setFriends([]);
          setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  const gridData = useMemo<GridRow[]>(() => {
    const sortedFriends = [...friends].sort((a, b) => b.streakDays - a.streakDays);
    return padToGridColumns(sortedFriends);
  }, [friends]);

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
        <FlatList
          data={gridData}
          keyExtractor={(item) => item.userId}
          numColumns={STREAK_GRID_COLUMNS}
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
