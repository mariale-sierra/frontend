import { create } from 'zustand';

/** Optional context for the richer version of the message — all three
 * present together is the common case (a normal logged day); any subset
 * missing just falls back to the plain "logged!" copy (see
 * UploadSuccessPopup.tsx). */
export interface UploadSuccessData {
  challengeName?: string;
  currentDay?: number;
  totalDays?: number;
}

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
  data: UploadSuccessData | null;
  show: (data?: UploadSuccessData) => void;
  hide: () => void;
}

export const useUploadSuccessStore = create<UploadSuccessStore>((set) => ({
  visible: false,
  data: null,
  show: (data) => set({ visible: true, data: data ?? null }),
  // The data stays put so the popup keeps its text while it fades out.
  hide: () => set({ visible: false }),
}));
