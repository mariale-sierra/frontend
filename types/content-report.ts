// Contracts for the backend's /reports endpoints (Sprint 8, Bloque 2 —
// manual moderation of workout posts and their comments only).

export type ReportTargetType = 'post' | 'comment';

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'nudity',
  'violence',
  'self_harm',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportStatus = 'pending' | 'dismissed' | 'actioned';
export type ReportResolutionAction = 'dismiss' | 'hide';

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface CreateReportResponse {
  id: number;
  status: ReportStatus;
  message: string;
}

export interface ReportContract {
  id: number;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; username: string };
  targetOwner: { id: string; username: string; strikeCount: number };
  target: {
    exists: boolean;
    isHidden: boolean;
    text: string | null;
    imageUrl: string | null;
    postId: string | null;
  };
}

export interface ListPendingReportsResponse {
  reports: ReportContract[];
  nextAfter: number | null;
}

export interface ResolveReportRequest {
  action: ReportResolutionAction;
  penalize?: boolean;
  note?: string;
}

export interface ResolveReportResponse {
  reportId: number;
  status: ReportStatus;
  action: ReportResolutionAction;
  contentHidden: boolean;
  penaltyRecorded: boolean;
  alsoResolvedReportIds: number[];
}
