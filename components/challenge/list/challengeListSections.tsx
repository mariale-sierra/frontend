import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Row } from '../../layout/row';
import { Stack } from '../../layout/stack';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ActiveChallengeCard } from './ActiveChallengeCard';
import { ExploreChallengeCard } from './ExploreChallengeCard';
import type { ActivityType } from '../../../constants/theme';
import { colors, radius, spacing } from '../../../constants/theme';

export interface ActiveChallengeViewModel {
  challengeId: string;
  title: string;
  day: number;
  progressPercent: number;
  streakCount: number;
  activityType: ActivityType;
  status: 'active' | 'completed' | 'left';
  isRestDay: boolean;
}

export interface ExploreChallengeViewModel {
  challengeId: string;
  title: string;
  subtitle: string;
  activityType: ActivityType;
  secondaryActivityType?: ActivityType;
  tertiaryActivityType?: ActivityType;
  durationDays: number;
  locationLabel: string;
}

export interface ChallengesScreenViewModel {
  activeChallenges: ActiveChallengeViewModel[];
  exploreChallenges: ExploreChallengeViewModel[];
}

export interface ChallengeListSectionsProps extends ChallengesScreenViewModel {
  title: string;
  activeLabel: string;
  exploreLabel: string;
  seeAllLabel: string;
  joinOrCreateLabel: string;
  streakLabelBuilder: (count: number) => string;
  onCreateChallenge?: () => void;
  onPressChallenge?: (id: string) => void;
  onPressActiveChallenge?: (id: string) => void;
  onPressExploreChallenge?: (id: string) => void;
  onPressActiveHeader?: () => void;
  onPressExploreHeader?: () => void;
}

function JoinOrCreateCard({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.activeCardPressable, pressed && styles.pressed]}>
      <View style={styles.joinCreateCard}>
        <Stack gap="sm" align="center" justify="center" style={styles.joinCreateContent}>
          <View style={styles.joinCreateIconCircle}>
            <Icon name="add" size={18} color={colors.textPrimary} />
          </View>
          <Text variant="body" align="center">{label}</Text>
        </Stack>
      </View>
    </Pressable>
  );
}

export function ChallengeListSections({
  title,
  activeLabel,
  exploreLabel,
  seeAllLabel,
  joinOrCreateLabel,
  streakLabelBuilder,
  activeChallenges,
  exploreChallenges,
  onCreateChallenge,
  onPressChallenge,
  onPressActiveChallenge,
  onPressExploreChallenge,
  onPressActiveHeader,
  onPressExploreHeader,
}: ChallengeListSectionsProps) {
  return (
    <Stack gap="lg">
      <Row justify="space-between" align="center">
        <Text variant="title">{title}</Text>

        <Pressable
          onPress={onCreateChallenge}
          style={({ pressed }) => [styles.headerActionButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={joinOrCreateLabel}
        >
          <Icon name="add" size={20} color={colors.textPrimary} />
        </Pressable>
      </Row>

      <Stack gap="sm">
        <Pressable
          onPress={onPressActiveHeader}
          style={({ pressed }) => [styles.headerRowPressable, pressed && styles.pressed]}
        >
          <Row justify="space-between" align="center">
            <Text variant="subheader" tone="secondary">{activeLabel}</Text>
            <Text variant="body" tone="secondary">{seeAllLabel}</Text>
          </Row>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalContent}>
          <Row justify="flex-start" align="stretch" gap="sm">
            {activeChallenges.map((challenge) => (
              <ActiveChallengeCard
                key={challenge.challengeId}
                challenge={challenge}
                statusLabel={streakLabelBuilder(challenge.streakCount)}
                onPress={() => (onPressActiveChallenge ?? onPressChallenge)?.(challenge.challengeId)}
              />
            ))}
            <JoinOrCreateCard label={joinOrCreateLabel} onPress={onCreateChallenge} />
          </Row>
        </ScrollView>
      </Stack>

      <Stack gap="sm">
        <Pressable
          onPress={onPressExploreHeader}
          style={({ pressed }) => [styles.headerRowPressable, pressed && styles.pressed]}
        >
          <Row justify="space-between" align="center">
            <Text variant="subheader" tone="secondary">{exploreLabel}</Text>
            <Text variant="body" tone="secondary">{seeAllLabel}</Text>
          </Row>
        </Pressable>

        <Stack gap="sm">
          {exploreChallenges.map((challenge) => (
            <ExploreChallengeCard
              key={challenge.challengeId}
              challenge={challenge}
              onPress={() => (onPressExploreChallenge ?? onPressChallenge)?.(challenge.challengeId)}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineActionPressable: {
    paddingVertical: spacing.xs,
  },
  headerRowPressable: {
    paddingVertical: spacing.xs,
  },
  horizontalScroll: {
    marginHorizontal: -spacing.lg,
  },
  horizontalContent: {
    paddingHorizontal: spacing.lg,
  },
  activeCardPressable: {
    alignSelf: 'flex-start',
  },
  joinCreateCard: {
    width: 172,
    minHeight: 200,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: spacing.md,
  },
  joinCreateContent: {
    flex: 1,
  },
  joinCreateIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
