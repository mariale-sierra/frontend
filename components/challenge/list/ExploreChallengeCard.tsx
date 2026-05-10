import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIcon } from '../../icons/activityIcon';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Text } from '../../ui/text';
import { ChallengeBadge } from './ChallengeBadge';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ExploreChallengeViewModel } from './challengeListSections';

interface ExploreChallengeCardProps {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
}

export function ExploreChallengeCard({ challenge, onPress }: ExploreChallengeCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#0c0c0e', colors.surface]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <Row justify="space-between" align="stretch" gap="md" style={styles.content}>
            <Stack style={styles.textAndBadges} justify="space-between">
              <Stack gap="xs">
                <Text variant="header" tone="primary" numberOfLines={1}>
                  {challenge.title}
                </Text>
                <Text variant="body" tone="secondary" numberOfLines={1}>
                  {challenge.subtitle}
                </Text>
              </Stack>

              <Row justify="flex-start" align="center" gap="sm" style={styles.badgesRow}>
                <ChallengeBadge label={challenge.durationLabel} />
                <ChallengeBadge label={challenge.locationLabel} />
              </Row>
            </Stack>

            <View style={styles.iconWrapper}>
              <ActivityIcon type={challenge.activityType} size="lg" glow />
            </View>
          </Row>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    width: '100%',
    minHeight: 130,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    flex: 1,
  },
  textAndBadges: {
    flex: 1,
    minWidth: 0,
  },
  badgesRow: {
    flexWrap: 'wrap',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
