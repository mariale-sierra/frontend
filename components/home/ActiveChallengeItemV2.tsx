import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentPill } from '../ui/accentPill';
import { Text } from '../ui/text';
import { ChallengeCard } from '../challenge/card/ChallengeCard';
import { ChallengeCardProgress } from '../challenge/card/ChallengeCardProgress';
import { useHomeChallengeCard } from './useHomeChallengeCard';
import { spacing } from '../../constants/theme';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';

interface ActiveChallengeItemV2Props {
  challenge: HomeActiveChallengeViewModel;
  hoursLeft: number;
}

/**
 * One of Home's hero cards, glow design: the shared `ChallengeCard` — the same
 * dark card, with a color glowing up from the bottom edge, as Challenges-Mine —
 * without the side panel, and filling its carousel slot (so the tallest card
 * sets the height for all of them). The "Active challenge"
 * eyebrow and today's status pill share the top row; the pill takes the state's
 * color (activity color, lavender on a rest day, green once today is logged),
 * and the glow, outline and progress fill all take one color, `glowColor` (see
 * `getChallengeGlowColor`): that same lavender / green on a rest day and once
 * today is logged, and the challenge's own activity color otherwise.
 *
 * Same logic as the classic hero card (both read `useHomeChallengeCard`) — only
 * the visuals differ. It fills whatever it's put in, so the carousel gives it
 * its width, and its height is the tallest card's.
 */
export const ActiveChallengeItemV2 = memo(function ActiveChallengeItemV2({
  challenge,
  hoursLeft,
}: ActiveChallengeItemV2Props) {
  const { t } = useTranslation();
  const { stateColor, glowColor, status, progress, accessibilityLabel, onPress } = useHomeChallengeCard(
    challenge,
    hoursLeft,
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fill, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <ChallengeCard
        accentColor={glowColor}
        sizing="fill"
        top={
          <View style={styles.topRow}>
            <Text variant="header" tone="secondary">
              {t('home.activeChallenge')}
            </Text>
            {status ? (
              <AccentPill size="sm" uppercase icon={status.icon} label={status.label} color={stateColor} />
            ) : null}
          </View>
        }
        title={challenge.title}
        footer={
          <ChallengeCardProgress
            progress={progress}
            currentDay={challenge.currentDay}
            totalDays={challenge.totalDays}
            accentColor={glowColor}
          />
        }
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // Fills the carousel slot it's given, so the tallest card (a long title wraps
  // to more lines) sets the height for all of them — the card stretches to it
  // and pins its progress to the bottom, instead of each card being its own height.
  fill: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  topRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
