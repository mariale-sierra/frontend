import { Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { ActivityIcon } from '../icons/activityIcon';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Card } from '../ui/card';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import type { ActivityType } from '../../constants/theme';
import { colors, radius, spacing } from '../../constants/theme';

export interface ActiveChallengeViewModel {
  challengeId: string;
  title: string;
  day: number;
  progressPercent: number;
  streakCount: number;
  activityType: ActivityType;
}

export interface ExploreChallengeViewModel {
  challengeId: string;
  title: string;
  subtitle: string;
  activityType: ActivityType;
  badges: [string, string, string];
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
  dayLabelBuilder: (day: number) => string;
  streakLabelBuilder: (count: number) => string;
  onCreateChallenge?: () => void;
  onPressChallenge?: (id: string) => void;
  onPressExploreHeader?: () => void;
}

function ChallengeBadge({ label }: { label: string }) {
  return (
    <View style={styles.challengeBadge}>
      <RNText style={styles.challengeBadgeText}>{label}</RNText>
    </View>
  );
}

function ChallengeProgressBar({ progressPercent }: { progressPercent: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
    </View>
  );
}

function ActiveChallengeCard({
  challenge,
  dayLabel,
  streakLabel,
  onPress,
}: {
  challenge: ActiveChallengeViewModel;
  dayLabel: string;
  streakLabel: string;
  onPress?: () => void;
}) {
  const flameColor = colors.activityType[challenge.activityType];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.activeCardPressable, pressed && styles.pressed]}>
      <View style={styles.activeCard}>
        <Row justify="space-between" align="center">
          <ActivityIcon type={challenge.activityType} size="md" />
          <ChallengeBadge label={dayLabel} />
        </Row>

        <View style={styles.activeCardBottom}>
          <Stack gap="xs">
            <Text variant="header" tone="primary" numberOfLines={2}>
              {challenge.title}
            </Text>
            <ChallengeProgressBar progressPercent={challenge.progressPercent} />
          </Stack>

          <Row justify="space-between" align="center" style={styles.activeCardFooter}>
            <Text variant="body" tone="secondary">{`${challenge.progressPercent}%`}</Text>
            <Row justify="flex-end" align="center" gap="xs">
              <Icon name="flame" size={14} color={flameColor} />
              <Text variant="body" tone="secondary">{streakLabel}</Text>
            </Row>
          </Row>
        </View>
      </View>
    </Pressable>
  );
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

function ExploreChallengeCard({
  challenge,
  onPress,
}: {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.exploreCardPressable, pressed && styles.pressed]}>
      <Card variant="basic" radius="xl" padding="lg" style={styles.exploreCard}>
        <Stack gap="md">
          <Row justify="space-between" align="center" gap="md">
            <Stack gap="xs" style={styles.exploreTextColumn}>
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
      </Card>
    </Pressable>
  );
}

export function ChallengeListSections({
  title,
  activeLabel,
  exploreLabel,
  seeAllLabel,
  joinOrCreateLabel,
  dayLabelBuilder,
  streakLabelBuilder,
  activeChallenges,
  exploreChallenges,
  onCreateChallenge,
  onPressChallenge,
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
        <Text variant="subheader" tone="secondary">{activeLabel}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalContent}>
          <Row justify="flex-start" align="stretch" gap="sm">
            {activeChallenges.map((challenge) => (
              <ActiveChallengeCard
                key={challenge.challengeId}
                challenge={challenge}
                dayLabel={dayLabelBuilder(challenge.day)}
                streakLabel={streakLabelBuilder(challenge.streakCount)}
                onPress={() => onPressChallenge?.(challenge.challengeId)}
              />
            ))}
            <JoinOrCreateCard label={joinOrCreateLabel} onPress={onCreateChallenge} />
          </Row>
        </ScrollView>
      </Stack>

      <Stack gap="sm">
        <Row justify="space-between" align="center">
          <Text variant="subheader" tone="secondary">{exploreLabel}</Text>

          <Pressable
            onPress={onPressExploreHeader}
            style={({ pressed }) => [styles.inlineActionPressable, pressed && styles.pressed]}
          >
            <Text variant="body" tone="secondary">{seeAllLabel}</Text>
          </Pressable>
        </Row>

        <Stack gap="sm">
          {exploreChallenges.map((challenge) => (
            <ExploreChallengeCard
              key={challenge.challengeId}
              challenge={challenge}
              onPress={() => onPressChallenge?.(challenge.challengeId)}
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineActionPressable: {
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
  activeCard: {
    width: 272,
    minHeight: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  activeCardBottom: {
    gap: spacing.xs,
  },
  activeCardFooter: {
    marginTop: spacing.xxs,
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
  challengeBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  challengeBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.textPrimary,
  },
  badgesRow: {
    flexWrap: 'wrap',
  },
  exploreCardPressable: {
    width: '100%',
  },
  exploreCard: {
    width: '100%',
    minHeight: 130,
  },
  exploreTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.86,
  },
});
