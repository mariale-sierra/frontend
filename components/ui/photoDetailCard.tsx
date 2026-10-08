import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './icon';
import { Text } from './text';
import { UserAvatar } from './userAvatar';
import { Row } from '../layout/row';
import { colors, radius, shadows, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { ChallengePhoto } from '../../types/challenge';

interface PhotoDetailCardProps {
  photo: ChallengePhoto;
  /** Right end of the header row — your own profile puts Delete here. */
  headerAction?: ReactNode;
}

/**
 * One photo in a vertical detail feed (ChallengePhotoGalleryModal,
 * formerly ProfilePhotoModal) — header row (avatar + username + day), photo, caption,
 * metrics table. The post's visibility sits on the photo's top-right corner
 * (a shadowed glyph, like the feed's "liked by" label). Mirrors Home's FeedPostCard structure (header row above the
 * photo, not text overlaid on top of it) rather than the old
 * PhotoFrame/PhotoUserOverlay approach: a dedicated header row reads
 * reliably regardless of the photo's own brightness/color, which
 * text-with-a-drop-shadow over an arbitrary image doesn't guarantee. No
 * likes/comment row here (unlike FeedPostCard) — this is a personal
 * progress-photo detail, not a social feed post.
 */
export function PhotoDetailCard({ photo, headerAction }: PhotoDetailCardProps) {
  const { t } = useTranslation();
  const hasDescription = !!photo.description;
  const hasMetrics = photo.metrics.length > 0;

  return (
    <View style={styles.card}>
      <Row gap="sm" justify="flex-start" style={styles.header}>
        <UserAvatar username={photo.userName} size={32} />
        <View style={styles.headerText}>
          <Text variant="label">{photo.userName}</Text>
          <Text variant="caption" tone="secondary">
            {t('challenges.dayLabel', { day: photo.day })}
          </Text>
        </View>
        {headerAction}
      </Row>

      <View style={styles.photoFrame}>
        {photo.imageUrl ? (
          <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Icon name="image-outline" size={42} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        )}
        <View style={styles.visibilityBadge} pointerEvents="none" testID="photo-visibility">
          <Icon
            name={photo.visibility === 'public' ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.paper}
            style={styles.overImage}
          />
        </View>
      </View>

      {hasDescription && (
        <Text variant="body" style={styles.description}>
          {photo.description}
        </Text>
      )}

      {hasMetrics && (
        <View style={styles.metricsCard}>
          {photo.metrics.map((metric, index) => (
            <View
              key={`${photo.id}-${metric.label}`}
              style={[styles.metricRow, index === photo.metrics.length - 1 && styles.metricRowLast]}
            >
              <Text variant="caption" tone="secondary" style={styles.metricLabel}>{metric.label}</Text>
              <Text variant="label" weight="bold" style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.small,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  visibilityBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  // Same dark outline as the feed's "liked by" label on a photo
  // (ReactorsSummary `overImage`), so the glyph reads over any picture.
  overImage: {
    textShadowColor: colors.ink,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: shadows.md.shadowRadius,
  },
  description: {
    opacity: 1,
  },
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },
  metricRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(colors.paper, 0.08),
  },
  metricRowLast: {
    borderBottomWidth: 0,
  },
  metricLabel: {
    flex: 1,
  },
  metricValue: {
    opacity: 1,
    fontVariant: ['tabular-nums'],
  },
});
