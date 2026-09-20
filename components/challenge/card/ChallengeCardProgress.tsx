import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { colors, fillOpacity, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { challengeCardText } from './challengeCardText';

const TRACK_HEIGHT = 6;
// The track is a groove the accent fill runs along: darker than the card where
// the glow is behind it (the bottom edge), lighter where the card is dark (the
// bottom of a card whose glow comes from the top).
const TRACK_OVER_GLOW = withAlpha(colors.ink, 0.45);
const TRACK_OVER_DARK = withAlpha(colors.paper, fillOpacity.strong);

interface ChallengeCardProgressProps {
  /** How far along the challenge is, 0 to 1. */
  progress: number;
  currentDay: number;
  totalDays: number;
  /** The challenge's own activity color, for the fill. */
  accentColor: string;
  /** The edge of the card its glow comes from, which decides what the bar's track
   * has to read against. Default `bottom`. */
  glowEdge?: 'top' | 'bottom';
}

/** The progress bar and "Day 12 / 21" line at the bottom of a challenge card —
 * shared by Challenges-Mine and Home's hero card. */
export function ChallengeCardProgress({
  progress,
  currentDay,
  totalDays,
  accentColor,
  glowEdge = 'bottom',
}: ChallengeCardProgressProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: glowEdge === 'bottom' ? TRACK_OVER_GLOW : TRACK_OVER_DARK }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
      </View>
      <Text variant="label" weight="bold" style={challengeCardText.primary}>
        {t('home.dayOf', { current: currentDay })}
        <Text variant="label" tone="secondary"> / {totalDays}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.big,
    // backgroundColor set inline — see TRACK_OVER_GLOW / TRACK_OVER_DARK.
    overflow: 'hidden',
  },
  // backgroundColor set inline — this challenge's own accent color.
  fill: {
    height: '100%',
    borderRadius: radius.big,
  },
});
