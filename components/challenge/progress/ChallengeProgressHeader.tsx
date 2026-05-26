import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../../layout/row';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { BackButton } from '../../ui/backButton';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { ParticipantAvatarStack } from './ParticipantAvatarStack';
import { ChallengePagerDots } from './ChallengePagerDots';
import { ChallengeProgressCard } from './ChallengeProgressCard';

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
          <BackButton size={36} />
          <ParticipantAvatarStack participants={participants} />
          <Text
            variant="body"
            tone="secondary"
            numberOfLines={1}
            style={styles.participantLabel}
          >
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

      <ChallengeProgressCard
        progress={progress}
        totalDays={totalDays}
        title={title}
        timeLeft={timeLeft}
      />

      <ChallengePagerDots activeIndex={activePage} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing['2xl'],
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
  pressed: {
    opacity: 0.82,
  },
});
