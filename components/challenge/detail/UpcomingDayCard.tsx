import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';
import { triggerLightHaptic } from '../../../utils/haptics';
import type { ChallengeDaySummary } from '../../../services/adapters/challengeDetailAdapter';

const BADGE_SIZE = 30;
const CHEVRON_SIZE = 18;

interface UpcomingDayCardProps {
  day: ChallengeDaySummary;
  /** What the row says it is: "Next in the cycle", "After that". */
  label: string;
  /** The challenge's own color, for a routine day's badge. */
  accentColor: string;
  /** Opens the day. Not used for a rest day — it has no routine to open. */
  onPress: () => void;
}

/**
 * One row of "what comes next in the cycle": the day's number, a small label and its
 * routine's name. A routine day is a plain `surface` card with the challenge's color
 * on its badge, and opens the day when pressed. A REST day is the plain `rest`-lavender
 * fill and, as on the rest-day screens, `ink` for everything on it — so it reads as
 * the rest day it is. It goes nowhere: no chevron, no pressed dip, and a tap is
 * answered with a light haptic and nothing else.
 */
export function UpcomingDayCard({ day, label, accentColor, onPress }: UpcomingDayCardProps) {
  const { t } = useTranslation();
  const rest = day.isRestDay;

  return (
    <Pressable
      onPress={rest ? triggerLightHaptic : onPress}
      style={({ pressed }) => [styles.card, rest && styles.restCard, pressed && !rest && styles.pressed]}
      accessibilityRole={rest ? undefined : 'button'}
    >
      <View style={[styles.badge, { backgroundColor: rest ? colors.ink : accentColor }]}>
        <Text variant="label" weight="bold" style={[styles.badgeText, rest && styles.restBadgeText]}>
          {day.day}
        </Text>
      </View>

      <View style={styles.textColumn}>
        <Text variant="caption" tone="secondary" inverse={rest}>
          {label}
        </Text>
        <Text variant="body" weight="bold" numberOfLines={1} inverse={rest} style={styles.title}>
          {rest ? t('challengeInfo.restDayLabel') : day.routineName}
        </Text>
      </View>

      {rest ? null : <Icon name="chevron-forward-outline" size={CHEVRON_SIZE} color={colors.paper} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.big,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  restCard: {
    backgroundColor: colors.rest,
  },
  pressed: {
    opacity: 0.9,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
  // On a rest card the badge is `ink`, so its number is the rest color.
  restBadgeText: {
    color: colors.rest,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    opacity: 1,
  },
});
