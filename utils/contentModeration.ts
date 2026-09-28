// B3 (Sprint 8): the backend rejects user text flagged by automatic
// moderation (challenges, comments, bio) with 400 + `code: 'CONTENT_REJECTED'`
// (see backend docs/moderacion-automatica.md). The global interceptor in
// services/api.ts shows the i18n toast for it; screens that show their own
// error on failure use this to avoid overwriting that toast with a generic
// message. Kept dependency-free (no api/i18n import) so hooks and screens
// can use it without pulling the axios client into their tests.
export function isContentRejectedError(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: { code?: unknown } } })
    ?.response;
  return response?.status === 400 && response?.data?.code === 'CONTENT_REJECTED';
}
