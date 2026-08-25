import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './icon';
import { Text } from './text';
import { UserAvatar } from './userAvatar';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { ChallengePhoto } from '../../types/challenge';

interface PhotoDetailCardProps {
  photo: ChallengePhoto;
}

/**
 * One photo in a vertical detail feed (ChallengePhotoGalleryModal,
 * ProfilePhotoModal) — header row (avatar + username + day), photo, caption,
 * metrics table. Mirrors Home's FeedPostCard structure (header row above the
 * photo, not text overlaid on top of it) rather than the old
 * PhotoFrame/PhotoUserOverlay approach: a dedicated header row reads
 * reliably regardless of the photo's own brightness/color, which
 * text-with-a-drop-shadow over an arbitrary image doesn't guarantee. No
 * likes/comment row here (unlike FeedPostCard) — this is a personal
 * progress-photo detail, not a social feed post.
 */
export function PhotoDetailCard({ photo }: PhotoDetailCardProps) {
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
        <Icon
          name={photo.visibility === 'public' ? 'eye-outline' : 'camera-outline'}
          size={16}
          color={photo.visibility === 'public' ? colors.primary : withAlpha(colors.paper, 0.4)}
        />
      </Row>

      <View style={styles.photoFrame}>
        {photo.imageUrl ? (
          <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Icon name="image-outline" size={42} color={withAlpha(colors.paper, 0.3)} />
        )}
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
