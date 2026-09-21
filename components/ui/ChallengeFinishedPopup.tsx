import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { useChallengeFinishedStore } from '../../store/challengeFinishedStore';

/**
 * The "Challenge complete" success popup. Mounted once at the app root
 * (app/_layout.tsx), next to `UploadSuccessPopup`, so it shows on top of whatever
 * screen the user is on when a challenge finishes. See
 * store/challengeFinishedStore.ts.
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
    />
  );
}
