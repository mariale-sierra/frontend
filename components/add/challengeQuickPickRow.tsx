import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { LogChallengeQuickPick } from '../../services/adapters/metricsAdapter';

interface ChallengeQuickPickRowProps {
  challenge: LogChallengeQuickPick;
  onPress: () => void;
}

/** One row in the "Log today's progress" bottom sheet. Sits on the sheet's
 * own `surface` background using `ink` instead — the same inverted-layer
 * "recessed slot" treatment pills already use on colored cards elsewhere. */
export function ChallengeQuickPickRow({ challenge, onPress }: ChallengeQuickPickRowProps) {
  const { t } = useTranslation();
  const dayLabel = t('logMetrics.pickChallenge.dayLabel', { day: challenge.currentDay });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {challenge.photoUrl ? (
        <Image source={{ uri: challenge.photoUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Icon name="image-outline" size={18} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        </View>
      )}

      <View style={styles.textColumn}>
        <Text variant="body" weight="bold" numberOfLines={1}>{challenge.name}</Text>
        <Text variant="caption" weight="medium" style={styles.dayLabel} numberOfLines={1}>
          {dayLabel}
        </Text>
      </View>

      <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, textOpacity.secondary)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.ink,
    padding: spacing.base,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.small,
    flexShrink: 0,
  },
  thumbPlaceholder: {
    // `paper`@20% — same neutral placeholder fill UserAvatar uses, not the
    // `ink`@18% ChallengeStatusCard uses for its photo panel: this row's own
    // background is already `ink`, so an `ink`-based placeholder would be
    // nearly invisible against it.
    backgroundColor: withAlpha(colors.paper, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dayLabel: {
    color: colors.primary,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
