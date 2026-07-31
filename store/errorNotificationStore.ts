import { create } from 'zustand';
import { ErrorNotificationConfig } from '../components/ui/errorNotification';

interface ErrorNotificationStore {
  visible: boolean;
  config: ErrorNotificationConfig;
  show: (config: ErrorNotificationConfig) => void;
  /** Green success toast — same banner, shorter default duration. */
  showSuccess: (config: Omit<ErrorNotificationConfig, 'variant'>) => void;
  hide: () => void;
}

export const useErrorNotificationStore = create<ErrorNotificationStore>((set) => ({
  visible: false,
  config: {
    message: '',
  },
  show: (config) => {
    set({
      visible: true,
      config: {
        duration: 5000, // default 5 seconds
        ...config,
      },
    });
  },
  showSuccess: (config) => {
    set({
      visible: true,
      config: {
        duration: 3000,
        ...config,
        variant: 'success',
      },
    });
  },
  hide: () => {
    set({ visible: false });
  },
}));
