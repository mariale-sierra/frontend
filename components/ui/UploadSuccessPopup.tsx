import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { ConfettiBurst } from '../challenge/progress/ConfettiBurst';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';
import { photoReviewMessageKey } from '../../utils/photoModeration';

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
 *
 * Onboarding Stage 6 ("richer upload-success popup"): the message names the
 * actual challenge and day when `progressLoggedFeedback.ts` was able to pass
 * that through (`store/uploadSuccessStore.ts`'s `UploadSuccessData`) —
 * "Day 12 of 75 logged for 'Iron Will'." instead of a generic "today's
 * progress is saved." Falls back to the plain generic copy whenever any
 * piece of that is missing (progress fetch failed, no challenge context,
 * etc.) rather than rendering a half-filled sentence.
 */
export function UploadSuccessPopup() {
  const { t } = useTranslation();
  const visible = useUploadSuccessStore((state) => state.visible);
  const data = useUploadSuccessStore((state) => state.data);
  const hide = useUploadSuccessStore((state) => state.hide);

  const logged =
    data?.challengeName && data.currentDay != null && data.totalDays != null
      ? t('camera.uploadSuccessMessageWithChallenge', {
          name: data.challengeName,
          currentDay: data.currentDay,
          totalDays: data.totalDays,
        })
      : t('camera.uploadSuccessMessage');
  // Sprint 10, B2: the day is logged; the photo has its own state (in review,
  // published, private, rejected) from the server's answer — a separate line,
  // and none at all for a rest day or when the API did not say.
  const description = data?.photo ? `${logged}\n\n${t(photoReviewMessageKey(data.photo))}` : logged;

  return (
    <ConfirmationPopup
      visible={visible}
      tone="success"
      icon="checkmark-circle-outline"
      title={t('camera.uploadSuccessTitle')}
      description={description}
      primaryButton={{ label: t('camera.uploadSuccessCta'), onPress: hide }}
      onDismiss={hide}
      overlay={<ConfettiBurst active={visible} />}
    />
  );
}
