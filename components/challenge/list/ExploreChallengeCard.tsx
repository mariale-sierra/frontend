import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { colors, radius, spacing } from '../../../constants/theme';
import { formatCount } from '../../../utils/format';
import type { ExploreChallengeViewModel } from './challengeListSections';

interface ExploreChallengeCardProps {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
}

export function ExploreChallengeCard({ challenge, onPress }: ExploreChallengeCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={styles.durationBadge}>
            <Icon name="calendar-outline" size={14} color={colors.ink} />
            <Text variant="caption" weight="bold" style={styles.durationText}>
              {t('challenges.durationDaysLabel', { count: challenge.durationDays })}
            </Text>
          </View>

          <View style={styles.titleBlock}>
            <Text variant="body" size="xl" weight="bold" numberOfLines={1}>
              {challenge.title}
            </Text>
            <Text variant="caption" tone="secondary">
              {challenge.restDaysCount > 0
                ? t('challenges.cycleSummary', {
                    cycle: challenge.cycleLengthDays,
                    count: challenge.restDaysCount,
                  })
                : t('challenges.noRestDays')}
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <Row justify="flex-start" style={styles.tagsRow}>
            <Row gap="xs" style={styles.tag}>
              <Icon name="location-outline" size={14} color={colors.paper} />
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {challenge.locationsLabel}
              </Text>
            </Row>
            <Row gap="xs" style={styles.tag}>
              <Icon name="flash-outline" size={14} color={colors.paper} />
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {challenge.categoriesLabel}
              </Text>
            </Row>
          </Row>

          <Row justify="space-between" align="center">
            <Row gap="sm" align="center">
              <Icon name="people-outline" size={18} color={colors.accent} />
              <Text variant="label" weight="bold" style={styles.membersText}>
                {t('challenges.membersCount', { count: formatCount(challenge.membersCount) })}
              </Text>
            </Row>

            <Row gap="xs" align="center">
              <Text variant="label" weight="bold" style={styles.viewText}>
                {t('challenges.view')}
              </Text>
              <Icon name="chevron-forward-outline" size={16} color={colors.primary} />
            </Row>
          </Row>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    width: '100%',
    height: 176,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  top: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
    backgroundColor: colors.paper,
  },
  durationText: {
    color: colors.ink,
    textTransform: 'uppercase',
    opacity: 1,
  },
  titleBlock: {
    gap: 2,
  },
  bottom: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  tagsRow: {
    flexWrap: 'wrap',
    rowGap: spacing.xs,
    columnGap: spacing.base,
  },
  tag: {
    flexShrink: 1,
  },
  membersText: {
    color: colors.accent,
    opacity: 1,
  },
  viewText: {
    color: colors.primary,
    opacity: 1,
  },
});
