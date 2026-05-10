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
          <Stack gap="md">
            <Row justify="space-between" align="center" gap="md">
              <Stack gap="xs" style={styles.textColumn}>
                <Text variant="header" tone="primary" numberOfLines={1}>
                  {challenge.title}
                </Text>
                <Text variant="body" tone="secondary" numberOfLines={1}>
                  {challenge.subtitle}
                </Text>
              </Stack>

              <ActivityIcon type={challenge.activityType} size="lg" />
            </Row>

            <Row justify="flex-start" align="center" gap="sm" style={styles.badgesRow}>
              {challenge.badges.map((badge, index) => (
                <ChallengeBadge key={`${challenge.challengeId}-badge-${index}`} label={badge} />
              ))}
            </Row>
          </Stack>
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
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  badgesRow: {
    flexWrap: 'wrap',
  },
  pressed: {
    opacity: 0.86,
  },
});
