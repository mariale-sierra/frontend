import { StyleSheet, View } from 'react-native';
import { PhotoFrame } from './photoFrame';
import { Text } from './text';
import { colors, radius, spacing } from '../../constants/theme';
import type { ChallengePhoto } from '../../types/challenge';

interface PhotoDetailCardProps {
  photo: ChallengePhoto;
}

export function PhotoDetailCard({ photo }: PhotoDetailCardProps) {
  const hasDescription = !!photo.description;
  const hasMetrics = photo.metrics.length > 0;

  return (
    <View style={styles.card}>
      <PhotoFrame imageUrl={photo.imageUrl ?? undefined} username={photo.userName} />

      {(hasDescription || hasMetrics) && (
        <View style={styles.body}>
          {hasDescription && (
            <Text variant="body" tone="secondary" style={styles.description}>
              {photo.description}
            </Text>
          )}

          {hasMetrics && (
            <>
              {hasDescription && <View style={styles.divider} />}
              <View style={styles.metricsTable}>
                {photo.metrics.map((metric, index) => (
                  <View
                    key={`${photo.id}-${metric.label}`}
                    style={[
                      styles.metricRow,
                      index === photo.metrics.length - 1 && styles.metricRowLast,
                    ]}
                  >
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  metricsTable: {
    backgroundColor: colors.background,
  },
  metricRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: spacing.md,
  },
  metricRowLast: {
    borderBottomWidth: 0,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.44)',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});
