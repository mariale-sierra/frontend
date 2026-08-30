import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmationPopup, ConfirmationButtonConfig } from '../components/ui/confirmationPopup';

export type ConfirmationPopupType = 'join' | 'leave';

interface UseConfirmationPopupOptions {
  type: ConfirmationPopupType;
  challengeName: string;
  onConfirm: () => void | Promise<void>;
}

interface UseConfirmationPopupReturn {
  Component: React.FC;
  show: () => void;
  hide: () => void;
}

// For challenge completion notifications
export interface ChallengeCompletionData {
  challengeId: string;
  challengeName: string;
  /** Whole-challenge length in days, e.g. 75 — kept as raw data, not a
   * pre-formatted string, so the popup can pluralize it correctly via i18n
   * (challenges.completionPopup.descriptionWithDuration_one/_other). */
  totalDays?: number;
  completedAt?: Date;
}

interface UseChallengeCompletionReturn {
  Component: React.FC;
  show: (data: ChallengeCompletionData) => void;
  hide: () => void;
}


export function useConfirmationPopup({
  type,
  challengeName,
  onConfirm,
}: UseConfirmationPopupOptions): UseConfirmationPopupReturn {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
      hide();
    } finally {
      setLoading(false);
    }
  }, [onConfirm, hide]);

  const getConfig = () => {
    switch (type) {
      case 'join':
        return {
          title: t('challenges.joinConfirm.title'),
          description: t('challenges.joinConfirm.description', { name: challengeName }),
          primaryButton: {
            label: t('challenges.joinConfirm.confirm'),
            onPress: handleConfirm,
            variant: 'primary' as const,
            loading,
          } as ConfirmationButtonConfig,
          secondaryButton: {
            label: t('challenges.joinConfirm.cancel'),
            onPress: hide,
            variant: 'neutral' as const,
            disabled: loading,
          } as ConfirmationButtonConfig,
        };

      case 'leave':
        return {
          title: t('challenges.leaveConfirm.title'),
          description: t('challenges.leaveConfirm.description', { name: challengeName }),
          primaryButton: {
            label: t('challenges.leaveConfirm.confirm'),
            onPress: handleConfirm,
            variant: 'danger' as const,
            loading,
          } as ConfirmationButtonConfig,
          secondaryButton: {
            label: t('challenges.leaveConfirm.stay'),
            onPress: hide,
            variant: 'primary' as const,
            disabled: loading,
          } as ConfirmationButtonConfig,
        };

    }
  };

  // Real bug, fixed 2026-08-29, per explicit "the popup blinks" report on
  // Leave Challenge: memoized for the exact same reason already documented
  // (and fixed) on useChallengeCompletion's own Component below, just never
  // applied here too. An unmemoized `Component` is a brand-new function
  // identity on every render — React treats that as a different component
  // TYPE, not the same one re-rendering, so it unmounts and remounts the
  // underlying Modal every time `loading`/`visible` changes (confirming
  // "Leave" flips `loading` to true immediately, well before the popup
  // actually closes) — that unmount/remount is the visible blink.
  const Component: React.FC = useMemo(
    () => () => (
      <ConfirmationPopup
        visible={visible}
        onDismiss={hide}
        {...getConfig()}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getConfig is
    // deliberately excluded: it's a plain function recreated every render
    // (not itself memoized), but every value it actually reads (type,
    // challengeName, loading, handleConfirm, hide, t) is already listed
    // below — adding getConfig itself back in would defeat this memo
    // entirely, recreating Component on every render again.
    [visible, type, challengeName, loading, handleConfirm, hide, t],
  );

  return { Component, show, hide };
}


export function useChallengeCompletion(options?: {
  onDismiss?: (data: ChallengeCompletionData) => void;
}): UseChallengeCompletionReturn {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [completionData, setCompletionData] = useState<ChallengeCompletionData | null>(null);

  const show = useCallback((data: ChallengeCompletionData) => {
    setCompletionData(data);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setCompletionData((current) => {
      options?.onDismiss?.(current!);
      return current;
    });
  }, [options]);

  // Memoized so its identity is stable across renders — otherwise every
  // render created a brand-new component type, which made React unmount and
  // remount the underlying Modal on every state update (the popup appeared
  // to flicker and never fully close).
  const Component: React.FC = useMemo(
    () =>
      function ChallengeCompletionPopup() {
        if (!completionData) return null;

        const description = completionData.totalDays
          ? t('challenges.completionPopup.descriptionWithDuration', {
              name: completionData.challengeName,
              count: completionData.totalDays,
            })
          : t('challenges.completionPopup.description', { name: completionData.challengeName });

        return (
          <ConfirmationPopup
            visible={visible}
            title={t('challenges.completionPopup.title')}
            description={description}
            primaryButton={{
              label: t('challenges.completionPopup.cta'),
              onPress: hide,
              variant: 'primary',
            }}
            onDismiss={hide}
          />
        );
      },
    [visible, completionData, hide, t],
  );

  return useMemo(() => ({ Component, show, hide }), [Component, show, hide]);
}
