import { create } from 'zustand';
import { ErrorNotificationConfig } from '../components/ui/errorNotification';

interface ErrorNotificationStore {
  visible: boolean;
  config: ErrorNotificationConfig;
  show: (config: ErrorNotificationConfig) => void;
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
  hide: () => {
    set({ visible: false });
  },
}));
