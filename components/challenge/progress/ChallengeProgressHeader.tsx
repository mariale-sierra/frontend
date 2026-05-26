import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../../layout/row';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { ParticipantAvatarStack } from './ParticipantAvatarStack';
import { ChallengePagerDots } from './ChallengePagerDots';

interface Participant {
  id: string;
  name: string;
  color: string;
}

interface ChallengeProgressHeaderProps {
  progress: number;
  totalDays: number;
  title: string;
  timeLeft: string;
  participantsLabel: string;
  participants: Participant[];
  activePage: number;
  onPressInfo: () => void;
}

export function ChallengeProgressHeader({
  progress,
  totalDays,
  title,
  timeLeft,
  participantsLabel,
  participants,
  activePage,
  onPressInfo,
}: ChallengeProgressHeaderProps) {
  return (
    <View style={styles.header}>
      <Row justify="space-between" align="center">
        <Row justify="flex-start" align="center" gap="sm" style={styles.participantRow}>
          <ParticipantAvatarStack participants={participants} />
          <Text variant="body" tone="secondary" numberOfLines={1} style={styles.participantLabel}>
            {participantsLabel}
          </Text>
        </Row>

        <Row justify="flex-end" align="center" gap="sm">
          <Pressable onPress={onPressInfo} style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
            <Text variant="label" style={styles.infoText}>INFO</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.gearButton, pressed && styles.pressed]}>
            <Icon name="settings-outline" size={21} color={colors.textPrimary} />
          </Pressable>
        </Row>
      </Row>

      <View style={styles.progressBlock}>
        <View style={styles.progressRow}>
          <Text style={styles.progressMain}>{progress}</Text>
          <Text style={styles.progressTotal}>/{totalDays}</Text>
        </View>

        <Text variant="label" style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.timePill}>
          <Icon name="time-outline" size={13} color={colors.textPrimary} />
          <Text variant="caption" style={styles.timeText}>{timeLeft}</Text>
        </View>
      </View>

      <ChallengePagerDots activeIndex={activePage} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  participantRow: {
    flex: 1,
    minWidth: 0,
  },
  participantLabel: {
    flexShrink: 1,
    color: 'rgba(255,255,255,0.74)',
  },
  infoButton: {
    minWidth: 58,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    ...typography.label,
    fontSize: 12,
    lineHeight: 14,
    color: colors.textInverse,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gearButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  progressMain: {
    ...typography.stat,
    color: colors.textPrimary,
    fontSize: 82,
    lineHeight: 86,
  },
  progressTotal: {
    ...typography.statSmall,
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 46,
  },
  title: {
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timeText: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.82,
  },
});
