import { create } from 'zustand';

/**
 * Drives the global "logged!" success popup shown after a photo/metrics
 * upload or a rest-day log completes. Deliberately global (not a per-screen
 * popup instance, unlike join/leave/logout) — the whole point is it needs to
 * appear on top of whatever screen the user lands back on once the (add)
 * modal flow is dismissed, which varies by entry point (Home, a challenge's
 * progress screen, the Log Metrics picker, ...). See UploadSuccessPopup,
 * mounted once at the app root in app/_layout.tsx.
 */
interface UploadSuccessStore {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useUploadSuccessStore = create<UploadSuccessStore>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
