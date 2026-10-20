import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, fillOpacity, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface ChallengeRulesStepProps {
  /** The challenge's own accent color — the camera badge's fill. */
  accentColor: string;
}

const RULES = [
  { key: 'dailyPhoto', icon: 'camera-outline' },
  { key: 'consistency', icon: 'calendar-outline' },
  { key: 'together', icon: 'people-outline' },
] as const;

const BADGE_SIZE = 72;
const RULE_ICON_SIZE = 40;

/**
 * Create challenge, last step: how every challenge works, before it starts — a
 * camera badge in the challenge's accent color (`ink` icon, as activity colors
 * pair with), then the rules, straight on the screen (no card): log a photo
 * every training day, consistency is the point (rest days are planned, nothing to
 * log), and everyone in the challenge sees the daily photos.
 */
export function ChallengeRulesStep({ accentColor }: ChallengeRulesStepProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID="challenge-rules">
      <View style={[styles.badge, { backgroundColor: accentColor }]}>
        <Icon name="camera" size={32} color={colors.ink} />
      </View>

      <View style={styles.rules}>
        {RULES.map((rule) => (
          <View key={rule.key} style={styles.rule}>
            <View style={styles.ruleIcon}>
              <Icon name={rule.icon} size={20} color={colors.paper} />
            </View>
            <View style={styles.ruleText}>
              <Text variant="body" weight="bold">
                {t(`challengeCreate.rules.${rule.key}.title`)}
              </Text>
              <Text variant="caption" tone="secondary">
                {t(`challengeCreate.rules.${rule.key}.body`)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  badge: {
    alignSelf: 'center',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rules: {
    gap: spacing.lg,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ruleIcon: {
    width: RULE_ICON_SIZE,
    height: RULE_ICON_SIZE,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    flex: 1,
    // Tight title + caption stack (design system's confirmed `2` exception).
    gap: 2,
  },
});
