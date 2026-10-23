import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { ConfettiBurst } from '../challenge/progress/ConfettiBurst';
import { useChallengeFinishedStore } from '../../store/challengeFinishedStore';
import { photoReviewMessageKey } from '../../utils/photoModeration';
import type { ChallengeRewardOutcome } from '../../utils/challengeReward';

const PARAGRAPH_BREAK = '\n\n';

/**
 * The "Challenge complete" success popup. Mounted once at the app root
 * (app/_layout.tsx), next to `UploadSuccessPopup`, so it shows on top of whatever
 * screen the user is on when a challenge finishes. See
 * store/challengeFinishedStore.ts.
 *
 * Also bursts confetti over it, per explicit request 2026-09-22 ("I want the
 * confetti animation when you see the completed challenge pop up too") —
 * the same `ConfettiBurst` the finished challenge's progress screen already
 * uses, passed through `ConfirmationPopup`'s `overlay` slot so it draws
 * inside the popup's own `Modal` layer (a plain sibling outside it would
 * render behind the modal, not over it). `active={visible}` re-bursts every
 * time this popup shows, not just the first time.
 */
export function ChallengeFinishedPopup() {
  const { t } = useTranslation();
  const visible = useChallengeFinishedStore((state) => state.visible);
  const challenge = useChallengeFinishedStore((state) => state.challenge);
  const hide = useChallengeFinishedStore((state) => state.hide);

  if (!challenge) return null;

  const finished = challenge.totalDays
    ? t('challenges.completionPopup.descriptionWithDuration', {
        name: challenge.challengeName,
        count: challenge.totalDays,
      })
    : t('challenges.completionPopup.description', { name: challenge.challengeName });
  // Sprint 10, B2: what it did for your badges (finishing is not always a new
  // badge) and the last photo's state, each only when it is actually known.
  const description = [
    finished,
    challenge.reward ? rewardLine(challenge.reward, t) : null,
    challenge.photo ? t(photoReviewMessageKey(challenge.photo)) : null,
  ]
    .filter(Boolean)
    .join(PARAGRAPH_BREAK);

  return (
    <ConfirmationPopup
      visible={visible}
      tone="success"
      icon="trophy-outline"
      title={t('challenges.completionPopup.title')}
      description={description}
      primaryButton={{ label: t('challenges.completionPopup.cta'), onPress: hide }}
      onDismiss={hide}
      overlay={<ConfettiBurst active={visible} />}
    />
  );
}

function rewardLine(reward: ChallengeRewardOutcome, t: TFunction): string {
  if (reward.kind === 'allEarned') return t('challenges.completionPopup.reward.allEarned');
  const badge = t(`badges.items.${reward.badgeCode}.name`, { defaultValue: reward.badgeCode });
  return reward.kind === 'earned'
    ? t('challenges.completionPopup.reward.earned', { badge })
    : t('challenges.completionPopup.reward.next', { badge, count: reward.remaining });
}
