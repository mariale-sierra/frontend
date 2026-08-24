import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../../layout/row';
import { Text } from '../../ui/text';
import { BackButton } from '../../ui/backButton';
import { IconButton } from '../../ui/iconButton';
import { colors, spacing } from '../../../constants/theme';
import { STATE_COLOR } from '../../../services/adapters/challengeState';
import type { ChallengeCardState } from '../../../services/adapters/challengeState';
import { ChallengeProgressRing } from './ChallengeProgressRing';
import { TodayRoutineBanner } from './TodayRoutineBanner';

interface ChallengeProgressHeaderProps {
  state: ChallengeCardState;
  title: string;
  currentDay: number;
  totalDays: number;
  ticks: string[];
  todayRoutineName: string | null;
  isTodayRestDay: boolean;
  onPressRoutine: () => void;
  onPressMembers: () => void;
  onPressInfo: () => void;
}

// challenges.trainDay/restDay/finished/left — the exact same eyebrow copy
// Challenges-Mine's status pill already uses (see ChallengeStatusCard),
// reused rather than re-worded here. `completed` is the one exception: this
// screen's own copy says "Day completed" (not just "Completed") since,
// unlike a card glanced at in a list, this is a full "how am I doing today"
// screen where the bare word read as ambiguous with "challenge completed."
const STATE_LABEL_KEY: Record<ChallengeCardState, string> = {
  active: 'challenges.trainDay',
  rest: 'challenges.restDay',
  completed: 'challengeProgress.dayCompletedLabel',
  won: 'challenges.finished',
  left: 'challenges.left',
};

export function ChallengeProgressHeader({
  state,
  title,
  currentDay,
  totalDays,
  ticks,
  todayRoutineName,
  isTodayRestDay,
  onPressRoutine,
  onPressMembers,
  onPressInfo,
}: ChallengeProgressHeaderProps) {
  const { t } = useTranslation();
  const stateColor = STATE_COLOR[state];

  return (
    <View>
      <Row justify="space-between" align="center" style={styles.topRow}>
        <BackButton style={styles.backButton} />
        <Row gap="xs" align="center">
          <IconButton
            name="people-outline"
            onPress={onPressMembers}
            accessibilityLabel={t('challengeProgress.membersA11y')}
          />
          <IconButton
            name="information-circle-outline"
            onPress={onPressInfo}
            accessibilityLabel={t('challengeProgress.infoA11y')}
          />
        </Row>
      </Row>

      <View style={styles.centerBlock}>
        <View style={styles.titleGroup}>
          <Text
            variant="caption"
            weight="bold"
            align="center"
            style={[styles.eyebrow, { color: stateColor }]}
          >
            {t(STATE_LABEL_KEY[state])}
          </Text>
          <Text variant="title" align="center">{title}</Text>
        </View>

        <ChallengeProgressRing ticks={ticks}>
          {/* Wireframe's center number is 52px — above the `3xl` (30px) cap, which
              is a hard rule (see skill → Explicitly Rejected Patterns: "no typography
              size above 3xl... redesign the layout instead"), so this stays at
              `title`'s default 3xl rather than matching the wireframe literally,
              same tradeoff already made for Home/Challenges-Mine's day counters. */}
          <Text variant="title">{currentDay}</Text>
          <Text variant="caption" weight="bold" tone="secondary" style={styles.ringSubLabel}>
            {t('challengeProgress.consistency.ofDays', { count: totalDays })}
          </Text>
        </ChallengeProgressRing>

        <Row gap="base" justify="center">
          <Row gap="xs" align="center">
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text variant="caption" tone="secondary">{t('challengeProgress.consistency.legendPhotoDays')}</Text>
          </Row>
          <Row gap="xs" align="center">
            <View style={[styles.legendDot, { backgroundColor: colors.rest }]} />
            <Text variant="caption" tone="secondary">{t('challengeProgress.consistency.legendRestDays')}</Text>
          </Row>
        </Row>
      </View>

      <View style={styles.bannerWrap}>
        <TodayRoutineBanner
          routineName={todayRoutineName}
          isRestDay={isTodayRestDay}
          onPress={onPressRoutine}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  centerBlock: {
    alignItems: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
  },
  titleGroup: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  eyebrow: {
    textTransform: 'uppercase',
    opacity: 1,
  },
  ringSubLabel: {
    textTransform: 'uppercase',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  bannerWrap: {
    paddingHorizontal: spacing.base,
    // Wireframe's own gap here is the same `lg` (24) as centerBlock's bottom
    // padding above — bumped an extra `sm` (8) per explicit request for
    // slightly more breathing room before the routine banner specifically
    // (24 + 8 = 32 = `xl`, still a real token, not an arbitrary value).
    marginTop: spacing.sm,
  },
});
