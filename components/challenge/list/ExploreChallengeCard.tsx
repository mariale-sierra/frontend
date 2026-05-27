import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIcon } from '../../icons/activityIcon';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Text } from '../../ui/text';
import { ChallengeBadge } from './ChallengeBadge';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ActivityType } from '../../../constants/theme';
import type { ExploreChallengeViewModel } from './challengeListSections';

interface ExploreChallengeCardProps {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
  daysLabel?: string;
}

const CATEGORY_NAMES: Record<ActivityType, string> = {
  strength: 'Strength',
  cardioIntense: 'Cardio',
  flexibility: 'Flexibility',
  cardioLow: 'Light Cardio',
  mindBody: 'Mind & Body',
  functional: 'Functional',
};

export function ExploreChallengeCard({ challenge, onPress, daysLabel = 'days' }: ExploreChallengeCardProps) {
  const activityTypes = [
    challenge.activityType,
    challenge.secondaryActivityType,
    challenge.tertiaryActivityType,
  ].filter((t): t is ActivityType => Boolean(t));

  const categoryLabel = activityTypes.map((t) => CATEGORY_NAMES[t]).join(' · ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#1a1a1c', '#050505']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Stack align="center" justify="center" gap="xxs" style={styles.daysStack}>
              <Text variant="title" tone="primary" style={styles.daysNumber}>
                {challenge.durationDays}
              </Text>
              <Text variant="label" tone="secondary">
                {daysLabel}
              </Text>
            </Stack>

            <View style={styles.divider} />

            <Stack gap="xs" justify="center" style={styles.textStack}>
              <Row align="center" justify="flex-start" gap="xs" style={styles.categoryRow}>
                {activityTypes.map((type) => (
                  <ActivityIcon key={type} type={type} size="md" variant="dot" />
                ))}
                <Text variant="label" numberOfLines={1} style={styles.categoryLabel}>
                  {categoryLabel}
                </Text>
              </Row>

              <Text variant="header" tone="primary" numberOfLines={1}>
                {challenge.title}
              </Text>
              <Text variant="body" tone="secondary" numberOfLines={1} style={styles.subtitle}>
                {challenge.subtitle}
              </Text>

              <Row justify="flex-start" align="center" style={styles.badgesRow}>
                <ChallengeBadge label={challenge.locationLabel} />
              </Row>
            </Stack>
          </View>
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
    minHeight: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  daysStack: {
    width: 92,
    flexShrink: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  daysNumber: {
    lineHeight: 32,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    padding: spacing.lg,
    paddingLeft: spacing.md,
  },
  categoryRow: {
    minWidth: 0,
  },
  categoryLabel: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgesRow: {
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  pressed: {
    opacity: 0.86,
  },
});
