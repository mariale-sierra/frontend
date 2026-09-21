import type { TFunction } from 'i18next';
import type { Icon } from '../../ui/icon';
import { getProgressFraction } from '../../../utils/challengeCycle';
import { getChallengeCardColor, getChallengeGlowColor, getChallengeGlowKey } from '../../../services/adapters/challengeState';
import type { ChallengeMineCardViewModel } from '../../../services/adapters/challengeListAdapter';

type IconName = React.ComponentProps<typeof Icon>['name'];
type ChallengeState = ChallengeMineCardViewModel['state'];

/** The props of a Challenges-Mine card — the same for every design of it. */
export interface ChallengeStatusCardProps {
  challenge: ChallengeMineCardViewModel;
  onPress?: () => void;
  /** Called when the "Add photo" dark camera square is tapped specifically
   * (only rendered in the `active`, i.e. not-yet-completed-today, state) —
   * a distinct action from tapping the rest of the card, added 2026-08-29
   * per explicit request so this shortcuts straight to logging THIS
   * challenge's progress instead of just opening its progress screen like
   * the rest of the card does. Optional so existing callers that don't need
   * this shortcut don't have to pass anything. */
  onPressAddPhoto?: () => void;
}

// State → the pill's icon. Every state uses the same pill chrome — only the
// icon and label change (see `getChallengeStatusCardModel`).
const STATE_ICON: Record<ChallengeState, IconName> = {
  active: 'camera-outline',
  rest: 'moon-outline',
  completed: 'checkmark-outline',
  won: 'trophy-outline',
  left: 'log-out-outline',
};

/** What the card's side panel shows — the `Add photo` shortcut, the user's
 * latest real photo, or a placeholder tile. */
export type StatusCardSidePanel = 'addPhoto' | 'photo' | 'placeholder';

/**
 * Everything a Challenges-Mine card decides from a challenge, shared by both
 * card designs (`ChallengeStatusCard`, the classic one, and
 * `ChallengeStatusCardV2`) so the *logic* — which state, which label, how far
 * along, what the side panel shows — exists once and only the visuals differ.
 *
 * `stateColor` is the shared `getChallengeCardColor()` (also used by Home's hero
 * card and the progress-ring eyebrow, so a palette tweak can't drift between
 * screens): `rest` / `completed` / `won` / `left` keep their own fixed meaning
 * (purple / green / neutral), and `active` resolves to the challenge's own
 * dominant-activity color (Activity Color System v2), falling back to
 * `colors.primary` when it has no dominant category yet. `won` and `left`
 * intentionally share one color (`neutral`) — one card variant covers every
 * "this challenge is no longer in progress" case.
 */
export function getChallengeStatusCardModel(challenge: ChallengeMineCardViewModel, t: TFunction) {
  const stateLabel =
    challenge.state === 'active'
      ? t('challenges.trainDay')
      : challenge.state === 'rest'
        ? t('challenges.restDay')
        : challenge.state === 'completed'
          ? t('challenges.completed')
          : challenge.state === 'won'
            ? t('challenges.finished')
            : t('challenges.left');

  // Only the in-progress, no-photo-yet-today case gets the "Add photo" CTA —
  // every other state shows the latest real photo if one exists, or a
  // placeholder tile otherwise.
  const sidePanel: StatusCardSidePanel =
    challenge.state === 'active' ? 'addPhoto' : challenge.latestPhotoUrl ? 'photo' : 'placeholder';

  return {
    stateColor: getChallengeCardColor(challenge.state, challenge.dominantActivityCategory),
    // What the glow card's light and outline take (lavender on a rest day, green
    // once today is done, the activity color otherwise) — the classic card has
    // no glow and doesn't read this.
    glowColor: getChallengeGlowColor(challenge.state, challenge.dominantActivityCategory),
    // Which mesh recipe the glow card draws (its own for a rest day and a
    // completed one, the activity's otherwise).
    glowKey: getChallengeGlowKey(challenge.state, challenge.dominantActivityCategory),
    stateIcon: STATE_ICON[challenge.state],
    stateLabel,
    progress: getProgressFraction(challenge.currentDay, challenge.totalDays),
    sidePanel,
  };
}
