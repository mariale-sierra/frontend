import { EmptyState } from '../ui/emptyState';
import type { EmptyStateAction } from '../ui/emptyState';
import { memo, useCallback, type ReactElement } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type RefreshControlProps,
} from 'react-native';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';
import type { ChallengePhoto } from '../../types/challenge';

const SKELETON_COUNT = 8;
const NUM_COLUMNS = 2;
// Rows mounted around the viewport. A profile can hold hundreds of photos; the
// grid used to mount every one of them (and decode every image) at once.
const INITIAL_ROWS = 4;
const WINDOW_SIZE = 7;

const PhotoTile = memo(function PhotoTile({
  photo,
  onPhotoPress,
}: {
  photo: ChallengePhoto;
  onPhotoPress?: (photo: ChallengePhoto) => void;
}) {
  const { t } = useTranslation();
  // Sprint 10, B2: only your own photos carry a review state (the API sends it
  // to the author alone); an approved one needs no label.
  const status = photo.moderationStatus === 'pending' || photo.moderationStatus === 'rejected' ? photo.moderationStatus : null;
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={() => onPhotoPress?.(photo)}
    >
      {photo.imageUrl ? (
        <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="cover" resizeMethod="resize" />
      ) : (
        <View style={styles.skeletonInner} />
      )}
      {status ? (
        <View style={styles.statusPill} testID={`photo-status-${status}`}>
          <Icon
            name={status === 'pending' ? 'time-outline' : 'close-circle-outline'}
            size={14}
            color={status === 'pending' ? colors.paper : colors.error}
          />
          <Text variant="caption" weight="bold">
            {t(status === 'pending' ? 'profile.photoStatus.pending' : 'profile.photoStatus.rejected')}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

function PhotoGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <View key={i} style={styles.tile}>
          <View style={styles.skeletonInner}>
            {i === 0 && <ActivityIndicator color={withAlpha(colors.paper, textOpacity.tertiary)} />}
          </View>
        </View>
      ))}
    </View>
  );
}

function PhotoGridEmpty({
  emptyLabel,
  emptyTitle,
  emptyActions,
  emptyIllustration,
}: Pick<PhotoGridListProps, 'emptyLabel' | 'emptyTitle' | 'emptyActions' | 'emptyIllustration'>) {
  if (emptyActions && emptyActions.length > 0) {
    return (
      <EmptyState
        icon="camera-outline"
        illustration={emptyIllustration}
        title={emptyTitle ?? emptyLabel}
        message={emptyTitle ? emptyLabel : undefined}
        actions={emptyActions}
        testID="photo-grid-empty"
      />
    );
  }
  return (
    <View style={styles.empty}>
      <Text variant="body" tone="secondary" align="center">
        {emptyLabel}
      </Text>
    </View>
  );
}

function RowSeparator() {
  return <View style={styles.rowSeparator} />;
}

interface PhotoGridListProps {
  photos: ChallengePhoto[];
  loading: boolean;
  emptyLabel: string;
  /** With `emptyActions`, the empty state gets a bold title above `emptyLabel` and buttons toward where photos come from. */
  emptyTitle?: string;
  emptyActions?: EmptyStateAction[];
  /** With `emptyActions`: an illustration in place of the icon, and just the
   * title as a single line (Sprint 10 — the user's own profile). */
  emptyIllustration?: ImageSourcePropType;
  onPhotoPress?: (photo: ChallengePhoto) => void;
  /** Everything above the grid (profile header, badges, toggle). */
  header?: ReactElement | null;
  /** Below the grid, after the "load more" row (e.g. the About link). */
  footer?: ReactElement | null;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: string;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentContainerStyle?: object;
}

/**
 * A profile screen as one virtualized list: `header` on top, the photos as a
 * two-column grid, then `footer`. Only the rows near the viewport are mounted,
 * and the next page loads as the grid nears its end (the "load more" button
 * stays as the visible indicator and a manual fallback).
 */
export function PhotoGridList({
  photos,
  loading,
  emptyLabel,
  emptyTitle,
  emptyActions,
  emptyIllustration,
  onPhotoPress,
  header,
  footer,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  loadMoreLabel = '',
  refreshControl,
  contentContainerStyle,
}: PhotoGridListProps) {
  const renderItem = useCallback(
    ({ item }: { item: ChallengePhoto }) => <PhotoTile photo={item} onPhotoPress={onPhotoPress} />,
    [onPhotoPress],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) onLoadMore?.();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <FlatList
      data={loading ? [] : photos}
      keyExtractor={(photo) => String(photo.id)}
      renderItem={renderItem}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.columns}
      ItemSeparatorComponent={RowSeparator}
      ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
      ListEmptyComponent={
        loading ? (
          <PhotoGridSkeleton />
        ) : (
          <PhotoGridEmpty
            emptyLabel={emptyLabel}
            emptyTitle={emptyTitle}
            emptyActions={emptyActions}
            emptyIllustration={emptyIllustration}
          />
        )
      }
      ListFooterComponent={
        <View>
          {hasMore && !loading ? (
            <Button variant="outline" size="sm" loading={loadingMore} onPress={onLoadMore} testID="posts-load-more">
              {loadMoreLabel}
            </Button>
          ) : null}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.6}
      initialNumToRender={INITIAL_ROWS * NUM_COLUMNS}
      maxToRenderPerBatch={INITIAL_ROWS * NUM_COLUMNS}
      windowSize={WINDOW_SIZE}
      refreshControl={refreshControl}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Same geometry as the wrapped grid this replaced: tiles from the left edge,
  // `sm` between columns and between rows.
  columns: {
    gap: spacing.sm,
  },
  rowSeparator: {
    height: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
  },
  tile: {
    width: '48.5%',
    // Wireframe tiles are ~175×214 (2-col grid at a 390px screen width,
    // `sm` gap) — that's a 4:5 ratio, not 3:4. Using aspectRatio (not a
    // fixed height) so it holds up at real device widths.
    aspectRatio: 4 / 5,
    borderRadius: radius.small,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Was `withAlpha(colors.paper, 0.1)` — a one-off value close to, but not
  // quite, the shared Skeleton primitive's own `subtle` fill (0.08),
  // purely because this tile predates that primitive and typed its own
  // number. Converged onto the real shared token — see `fillOpacity`.
  skeletonInner: {
    flex: 1,
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  statusPill: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.ink, 0.7),
  },
  empty: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
});
