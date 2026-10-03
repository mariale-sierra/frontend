import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { ConfettiBurst } from '../challenge/progress/ConfettiBurst';
import { useChallengeFinishedStore } from '../../store/challengeFinishedStore';

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

  const description = challenge.totalDays
    ? t('challenges.completionPopup.descriptionWithDuration', {
        name: challenge.challengeName,
        count: challenge.totalDays,
      })
    : t('challenges.completionPopup.description', { name: challenge.challengeName });

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
