import api from '../api';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ListPendingReportsResponse,
  ResolveReportRequest,
  ResolveReportResponse,
} from '../../types/content-report';

export async function createReport(
  body: CreateReportRequest,
): Promise<CreateReportResponse> {
  const { data } = await api.post<CreateReportResponse>('/reports', body);
  return data;
}

/** Admin only — the backend's AdminGuard answers 403 for anyone else. */
export async function listPendingReports(
  after?: number,
  limit?: number,
): Promise<ListPendingReportsResponse> {
  const { data } = await api.get<ListPendingReportsResponse>('/reports/pending', {
    params: { after, limit },
  });
  return data;
}

/** Admin only. A report already resolved (e.g. by another admin) answers 409. */
export async function resolveReport(
  reportId: number,
  body: ResolveReportRequest,
): Promise<ResolveReportResponse> {
  const { data } = await api.patch<ResolveReportResponse>(
    `/reports/${reportId}/resolve`,
    body,
  );
  return data;
}
