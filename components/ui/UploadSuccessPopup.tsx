import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from './confirmationPopup';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';

/**
 * Mounted once at the app root (app/_layout.tsx), as a sibling of the
 * navigator — not inside any one screen. It has to render regardless of
 * which screen is currently on top, since the flow that triggers it
 * (camera.tsx / rest-day.tsx) dismisses the whole (add) modal stack back to
 * whatever screen the user started from before showing it. See
 * store/uploadSuccessStore.ts.
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
    />
  );
}
