import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { Row } from '../../layout/row';
import { colors, radius, spacing } from '../../../constants/theme';

interface ChallengeRoutineDayCardProps {
  day: number;
  isRestDay: boolean;
  /** Routine name for a workout day — unused for a rest day, which always shows the localized "Rest day" label instead. */
  routineName: string;
  /** Already-formatted "{{n}} exercises · {{location}}" — unused for a rest day. */
  subtitle: string;
  /** Activity Color System v2 — this challenge's own resolved accent color,
   * used for the workout-day badge. The rest-day case stays fixed `colors.rest`. */
  accentColor: string;
  onPress?: () => void;
}

/** One row in "The cycle" list (Challenge-Info) — List-row card pattern
 * (`surface` bg, `medium` radius) with a numbered circle badge instead of an
 * icon. Rest days share the same row shape but read as non-interactive: no
 * chevron, `rest`-colored title, muted "no photo needed" subtitle, since
 * there's no routine to view. */
export default function ChallengeRoutineDayCard({ day, isRestDay, routineName, subtitle, accentColor, onPress }: ChallengeRoutineDayCardProps) {
  const { t } = useTranslation();
  const badgeColor = isRestDay ? colors.rest : accentColor;

  const content = (
    <Row align="center" gap="md" style={styles.row}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text variant="label" weight="bold" style={styles.badgeText}>{day}</Text>
      </View>

      <View style={styles.textColumn}>
        <Text variant="body" weight="bold" numberOfLines={1} style={isRestDay ? styles.restTitle : styles.title}>
          {isRestDay ? t('challengeInfo.restDayLabel') : routineName}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {isRestDay ? t('challengeInfo.restDayNoPhoto') : subtitle}
        </Text>
      </View>

      {!isRestDay && <Icon name="chevron-forward-outline" size={18} color={colors.paper} />}
    </Row>
  );

  if (isRestDay) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  row: {
    width: '100%',
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: colors.ink,
    opacity: 1,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    opacity: 1,
  },
  restTitle: {
    color: colors.rest,
    opacity: 1,
  },
});
