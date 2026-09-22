import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { ConfettiBurst } from '../challenge/progress/ConfettiBurst';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';

/**
 * Mounted once at the app root (app/_layout.tsx), as a sibling of the
 * navigator — not inside any one screen. It has to render regardless of
 * which screen is currently on top, since the flow that triggers it
 * (camera.tsx / rest-day.tsx) dismisses the whole (add) modal stack back to
 * whatever screen the user started from before showing it. See
 * store/uploadSuccessStore.ts.
 *
 * Also bursts confetti, per explicit request 2026-09-22 ("whenever you log
 * in a day, I want the confetti effect please") — this is THE shared
 * "you logged today" moment (`utils/progressLoggedFeedback.ts`'s
 * `showProgressLoggedFeedback()`, called after both a photo upload and a
 * rest-day submission; only the OTHER branch of that same function, "this
 * was the challenge's last day," shows `ChallengeFinishedPopup` instead,
 * which already got its own confetti earlier), so one `overlay` here covers
 * every ordinary logged day. Same `ConfettiBurst`/`ConfirmationPopup.overlay`
 * mechanism as that popup — see either's own doc comment for why the burst
 * has to go through `overlay` (drawn inside the `Modal`'s own layer) rather
 * than as a plain sibling.
 */
export function UploadSuccessPopup() {
  const { t } = useTranslation();
  const visible = useUploadSuccessStore((state) => state.visible);
  const hide = useUploadSuccessStore((state) => state.hide);

  return (
    <ConfirmationPopup
      visible={visible}
      tone="success"
      icon="checkmark-circle-outline"
      title={t('camera.uploadSuccessTitle')}
      description={t('camera.uploadSuccessMessage')}
      primaryButton={{ label: t('camera.uploadSuccessCta'), onPress: hide }}
      onDismiss={hide}
      overlay={<ConfettiBurst active={visible} />}
    />
  );
}
