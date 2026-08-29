import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { colors, radius, spacing } from '../../../constants/theme';
import { formatCount } from '../../../utils/format';
import { getChallengeAccentColor } from '../../../services/adapters/challengeState';
import type { ExploreChallengeViewModel } from './challengeListSections';

interface ExploreChallengeCardProps {
  challenge: ExploreChallengeViewModel;
  onPress?: () => void;
}

export function ExploreChallengeCard({ challenge, onPress }: ExploreChallengeCardProps) {
  const { t } = useTranslation();
  // Activity Color System v2 — falls back to colors.primary when this
  // challenge has no dominant category yet.
  const accentColor = getChallengeAccentColor(challenge.dominantActivityCategory);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={[styles.durationBadge, { backgroundColor: accentColor }]}>
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
              <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.tagText}>
                {challenge.locationsLabel}
              </Text>
            </Row>
            <Row gap="xs" style={styles.tag}>
              <Icon name="flash-outline" size={14} color={colors.paper} />
              <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.tagText}>
                {challenge.categoriesLabel}
              </Text>
            </Row>
          </Row>

          <Row justify="space-between" align="center">
            <Row gap="sm" align="center">
              <Icon name="people-outline" size={18} color={accentColor} />
              <Text variant="label" weight="bold" style={[styles.membersText, { color: accentColor }]}>
                {t('challenges.membersCount', { count: formatCount(challenge.membersCount) })}
              </Text>
            </Row>

            <Row gap="xs" align="center">
              <Text variant="label" weight="bold" style={[styles.viewText, { color: accentColor }]}>
                {t('challenges.view')}
              </Text>
              <Icon name="chevron-forward-outline" size={16} color={accentColor} />
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
    // backgroundColor set inline — this challenge's own accent color, see accentColor above.
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
    // Deliberately NOT flexWrap — this row must stay one line. Overflowing
    // text truncates via numberOfLines={1} on each tag's Text instead of
    // wrapping, which used to push content past the card's fixed height.
    columnGap: spacing.base,
  },
  tag: {
    flexShrink: 1,
    minWidth: 0,
  },
  tagText: {
    flexShrink: 1,
  },
  membersText: {
    // color set inline — this challenge's own accent color, see accentColor above.
    opacity: 1,
  },
  viewText: {
    // color set inline — this challenge's own accent color, see accentColor above.
    opacity: 1,
  },
});
