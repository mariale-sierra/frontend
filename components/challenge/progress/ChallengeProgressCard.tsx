import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing, typography } from '../../../constants/theme';

interface Props {
  progress: number;
  totalDays: number;
  title: string;
  timeLeft: string;
}

export function ChallengeProgressCard({ progress, totalDays, title, timeLeft }: Props) {
  const percent = totalDays > 0 ? Math.max(0, Math.min(100, (progress / totalDays) * 100)) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.progressRow}>
        <Text style={styles.currentDay}>{progress}</Text>
        <Text style={styles.totalDays}>/{totalDays}</Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
      </View>

      <Text variant="subheader" style={styles.title}>{title}</Text>

      <View style={[styles.badge, styles.timeBadge]}>
        <Icon name="time-outline" size={13} color={colors.textPrimary} />
        <Text style={styles.timeBadgeText}>{timeLeft}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentDay: {
    ...typography.stat,
    color: colors.textPrimary,
  },
  totalDays: {
    ...typography.statSmall,
    color: colors.textSecondary,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  progressBarTrack: {
    width: '80%',
    height: 6,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  badge: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius['2xl'],
    borderWidth: 1,
  },
  timeBadge: {
    borderColor: colors.textPrimary,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 3,
  },
  timeBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
});
