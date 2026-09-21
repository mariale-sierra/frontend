import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { useChallengeJoinApprovedStore } from '../../store/challengeJoinApprovedStore';

/**
 * The "You're in!" popup — the requester's only way to find out a private
 * challenge's owner approved their join request (see
 * store/challengeJoinApprovedStore.ts). Mounted once at the app root
 * (app/_layout.tsx), next to `ChallengeFinishedPopup`/`UploadSuccessPopup`,
 * so it shows on top of whatever screen the user is on.
 */
export function ChallengeJoinApprovedPopup() {
  const { t } = useTranslation();
  const visible = useChallengeJoinApprovedStore((state) => state.visible);
  const challenge = useChallengeJoinApprovedStore((state) => state.challenge);
  const hide = useChallengeJoinApprovedStore((state) => state.hide);

  if (!challenge) return null;

  return (
    <ConfirmationPopup
      visible={visible}
      tone="success"
      icon="checkmark-circle-outline"
      title={t('challenges.joinApprovedPopup.title')}
      description={t('challenges.joinApprovedPopup.description', { name: challenge.challengeName })}
      primaryButton={{ label: t('challenges.joinApprovedPopup.cta'), onPress: hide }}
      onDismiss={hide}
    />
  );
}
