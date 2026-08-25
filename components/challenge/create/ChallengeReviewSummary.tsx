import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Divider } from '../../ui/divider';
import { Row } from '../../layout/row';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import type { ChallengeVisibility } from '../../../types/challenge';
import type { CycleDayStatus } from './CycleDayList';

interface ChallengeReviewSummaryProps {
  title: string;
  cycleLengthDays: number;
  cyclesCount: number;
  durationDays: number;
  visibility: ChallengeVisibility | null;
  selectedCategories: string[];
  selectedLocations: string[];
  getDayStatus: (dayNumber: number) => CycleDayStatus;
  getDayRoutineLabel: (dayNumber: number) => string | undefined;
  onEditSetup: () => void;
  onEditCycle: () => void;
}

function SummaryRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <>
      <Row justify="flex-start" align="flex-start" gap="md" style={styles.summaryRow}>
        <Text variant="caption" tone="secondary" style={styles.summaryRowLabel}>{label}</Text>
        <Text variant="label" weight="bold" style={styles.summaryRowValue}>{value}</Text>
      </Row>
      {!isLast && <Divider />}
    </>
  );
}

export function ChallengeReviewSummary({
  title,
  cycleLengthDays,
  cyclesCount,
  durationDays,
  visibility,
  selectedCategories,
  selectedLocations,
  getDayStatus,
  getDayRoutineLabel,
  onEditSetup,
  onEditCycle,
}: ChallengeReviewSummaryProps) {
  const { t } = useTranslation();
  const days = useMemo(() => Array.from({ length: cycleLengthDays }, (_, index) => index + 1), [cycleLengthDays]);
  const restDaysCount = useMemo(() => days.filter((day) => getDayStatus(day) === 'rest').length, [days, getDayStatus]);

  const visibilityLabel = visibility
    ? t(`challengeCreate.visibility.${visibility.toLowerCase()}Label`)
    : t('challengeCreate.review.notSelectedYet');

  const heroCaption = [
    t('challengeCreate.review.cycleLengthFragment', { count: cycleLengthDays }),
    t('challengeCreate.review.restDayFragment', { count: restDaysCount, cycleLengthDays }),
    visibilityLabel,
  ].join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Row justify="flex-start" align="flex-end" gap="sm">
          <Text variant="title" tone="inverse" style={styles.heroDays}>{durationDays}</Text>
          <Text variant="subheader" tone="inverse" style={styles.heroDaysUnit}>
            {t('challengeCreate.review.daysUnit')}
          </Text>
        </Row>
        <Text variant="title" tone="inverse" numberOfLines={2}>
          {title || t('challengeCreate.review.untitledChallenge')}
        </Text>
        <Text variant="label" weight="bold" tone="inverse" style={styles.heroCaption}>
          {heroCaption}
        </Text>
      </View>

      <View style={styles.card}>
        <Row justify="space-between" align="center" style={styles.cardHeader}>
          <Text variant="header" tone="secondary">{t('challengeCreate.review.setupLabel')}</Text>
          <Pressable onPress={onEditSetup} hitSlop={8}>
            <Text variant="label" weight="bold" style={styles.editLink}>{t('challengeCreate.review.edit')}</Text>
          </Pressable>
        </Row>

        <SummaryRow
          label={t('challengeCreate.review.categoriesLabel')}
          value={selectedCategories.join(', ') || t('challengeCreate.review.noneSelected')}
        />
        <SummaryRow
          label={t('challengeCreate.review.locationLabel')}
          value={selectedLocations.join(', ') || t('challengeCreate.review.noneSelected')}
        />
        <SummaryRow
          label={t('challengeCreate.review.cycleLabel')}
          value={t('challengeCreate.review.cycleValue', { cycleLengthDays, cyclesCount })}
          isLast
        />
      </View>

      <View style={styles.card}>
        <Row justify="space-between" align="center" style={styles.cardHeader}>
          <Text variant="header" tone="secondary">{t('challengeCreate.review.cycleSectionLabel')}</Text>
          <Pressable onPress={onEditCycle} hitSlop={8}>
            <Text variant="label" weight="bold" style={styles.editLink}>{t('challengeCreate.review.edit')}</Text>
          </Pressable>
        </Row>

        {days.map((day, index) => {
          const status = getDayStatus(day);
          const value = status === 'rest'
            ? t('challengeInfo.restDayLabel')
            : getDayRoutineLabel(day) ?? t('challengeCreate.review.notSelectedYet');

          return (
            <Fragment key={`review-day-${day}`}>
              <SummaryRow
                label={t('challengeCreate.review.dayLabel', { day })}
                value={value}
                isLast={index === days.length - 1}
              />
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.big,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroDays: {
    opacity: 1,
  },
  heroDaysUnit: {
    opacity: 0.6,
  },
  heroCaption: {
    opacity: 0.7,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    padding: spacing.base,
    gap: spacing.xs,
  },
  cardHeader: {
    paddingBottom: spacing.xs,
  },
  editLink: {
    color: colors.primary,
    opacity: 1,
  },
  summaryRow: {
    paddingVertical: spacing.md,
  },
  summaryRowLabel: {
    width: 84,
    flexShrink: 0,
  },
  summaryRowValue: {
    flex: 1,
  },
});
