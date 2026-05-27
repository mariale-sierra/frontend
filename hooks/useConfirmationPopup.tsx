import { useState, useCallback } from 'react';
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
  duration?: string; // e.g., "30 days", "7 weeks"
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
          title: 'Join?',
          description: `Will you join "${challengeName}"?`,
          primaryButton: {
            label: 'Join',
            onPress: handleConfirm,
            variant: 'primary' as const,
            loading,
          } as ConfirmationButtonConfig,
          secondaryButton: {
            label: 'Cancel',
            onPress: hide,
            variant: 'outline' as const,
            disabled: loading,
          } as ConfirmationButtonConfig,
        };

      case 'leave':
        return {
          title: 'Leave Challenge?',
          description: `Are you sure you want to leave "${challengeName}"? Your progress will be saved.`,
          primaryButton: {
            label: 'Leave',
            onPress: handleConfirm,
            variant: 'danger' as const,
            loading,
          } as ConfirmationButtonConfig,
          secondaryButton: {
            label: 'Stay',
            onPress: hide,
            variant: 'primary' as const,
            disabled: loading,
          } as ConfirmationButtonConfig,
        };

    }
  };

  const Component: React.FC = () => (
    <ConfirmationPopup
      visible={visible}
      onDismiss={hide}
      {...getConfig()}
    />
  );

  return { Component, show, hide };
}


export function useChallengeCompletion(options?: {
  onDismiss?: (data: ChallengeCompletionData) => void;
}): UseChallengeCompletionReturn {
  const [visible, setVisible] = useState(false);
  const [completionData, setCompletionData] = useState<ChallengeCompletionData | null>(null);

  const show = useCallback((data: ChallengeCompletionData) => {
    setCompletionData(data);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    options?.onDismiss?.(completionData!);
    setVisible(false);
  }, [completionData, options]);

  const Component: React.FC = () => {
    if (!completionData) return null;

    return (
      <ConfirmationPopup
        visible={visible}
        title="🎉 Challenge Complete!"
        description={
          completionData.duration
            ? `You completed "${completionData.challengeName}" in ${completionData.duration}!`
            : `Great job completing "${completionData.challengeName}"!`
        }
        primaryButton={{
          label: 'Awesome!',
          onPress: hide,
          variant: 'primary',
        }}
        onDismiss={hide}
      />
    );
  };

  return { Component, show, hide };
}
