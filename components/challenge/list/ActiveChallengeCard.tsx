import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Pressable } from 'react-native';
import { ActivityIcon } from '../../icons/activityIcon';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { DayLabel } from './DayLabel';
import { ChallengeProgressBar } from './ChallengeProgressBar';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ActiveChallengeViewModel } from './challengeListSections';

interface ActiveChallengeCardProps {
  challenge: ActiveChallengeViewModel;
  dayLabel: string;
  streakLabel: string;
  onPress?: () => void;
}

export function ActiveChallengeCard({
  challenge,
  dayLabel,
  streakLabel,
  onPress,
}: ActiveChallengeCardProps) {
  const flameColor = colors.activityType[challenge.activityType];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View style={styles.card}>
        <LinearGradient
          colors={[colors.surface, colors.background]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Row justify="space-between" align="center">
              <ActivityIcon type={challenge.activityType} size="md" />
              <DayLabel label={dayLabel} />
            </Row>

            <View style={styles.bottom}>
              <Stack gap="xs">
                <Text variant="header" tone="primary" numberOfLines={2}>
                  {challenge.title}
                </Text>
                <ChallengeProgressBar progressPercent={challenge.progressPercent} />
              </Stack>

              <Row justify="space-between" align="center" style={styles.footer}>
                <Text variant="body" tone="secondary">{`${challenge.progressPercent}%`}</Text>
                <Row justify="flex-end" align="center" gap="xs">
                  <Icon name="flame" size={14} color={flameColor} />
                  <Text variant="body" tone="secondary">{streakLabel}</Text>
                </Row>
              </Row>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  card: {
    width: 272,
    minHeight: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    minHeight: 200,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottom: {
    gap: spacing.xs,
  },
  footer: {
    marginTop: spacing.xxs,
  },
  pressed: {
    opacity: 0.86,
  },
});

