import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Icon } from '../ui/icon';
import { getProgressFraction } from '../../utils/challengeCycle';
import { getChallengeCardColor, getChallengeGlowColor } from '../../services/adapters/challengeState';
import type { HomeActiveChallengeViewModel } from '../../services/adapters/homeAdapter';

type IconName = React.ComponentProps<typeof Icon>['name'];

/**
 * Everything Home's hero card decides from a challenge, shared by both card
 * designs (the classic one in `ActiveChallengeSection`, and
 * `ActiveChallengeItemV2`) so the *logic* — where a tap goes, which state pill
 * shows, how far along it is — exists once and only the visuals differ.
 */
export function useHomeChallengeCard(challenge: HomeActiveChallengeViewModel, hoursLeft: number) {
  const { t } = useTranslation();
  const router = useRouter();

  // Per explicit request: tapping the card jumps straight into logging
  // today's progress for THIS challenge (skipping the challenge-picker
  // sheet, same `/(add)/metrics?challengeId=` shortcut Challenges-Mine's
  // own "Add photo" square already uses) — but only when there's actually
  // something to log today. `rest`/`completed` have nothing to log (no
  // routine today / already logged today), so those go to the challenge's
  // own progress screen instead, same destination Challenges-Mine's card
  // itself opens on a normal tap (`/challenge/:id/progress`).
  function onPress() {
    if (challenge.state === 'active') {
      router.push(`/(add)/metrics?challengeId=${challenge.challengeId}`);
    } else {
      router.push(`/challenge/${challenge.challengeId}/progress`);
    }
  }

  // Card color signals state — same shared getChallengeCardColor()
  // (challengeState.ts) used by Challenges-Mine's status card and the
  // progress-ring eyebrow. `rest`/`completed` keep their own fixed meaning
  // (purple/green) unchanged; only `active` resolves to the challenge's own
  // dominant-activity color now (Activity Color System v2), falling back to
  // `colors.primary` (white) when the challenge has no dominant category
  // yet. `completed` means TODAY has a logged photo, not "the whole
  // challenge is done" (a genuinely finished/left challenge never reaches
  // this component at all — getHomeChallengesSorted excludes those, see
  // homeAdapter.ts).
  const stateColor = getChallengeCardColor(challenge.state, challenge.dominantActivityCategory);
  const showTimeBadge = challenge.state === 'active' && hoursLeft > 0;

  // The status pill: today's state, or the time left to log when there's
  // something to log — none otherwise.
  const status: { icon: IconName; label: string } | null =
    challenge.state === 'completed'
      ? { icon: 'checkmark-outline', label: t('home.completed') }
      : challenge.state === 'rest'
        ? { icon: 'moon-outline', label: t('home.restDay') }
        : showTimeBadge
          ? { icon: 'flame-outline', label: t('home.hoursLeft', { hours: hoursLeft }) }
          : null;

  return {
    stateColor,
    // What the glow card's light and outline take (lavender on a rest day, green
    // once today is logged, the activity color otherwise) — the classic card has
    // no glow and doesn't read this.
    glowColor: getChallengeGlowColor(challenge.state, challenge.dominantActivityCategory),
    status,
    progress: getProgressFraction(challenge.currentDay, challenge.totalDays),
    accessibilityLabel:
      challenge.state === 'active'
        ? t('home.logProgressA11y', { name: challenge.title })
        : t('home.openChallengeA11y', { name: challenge.title }),
    onPress,
  };
}
