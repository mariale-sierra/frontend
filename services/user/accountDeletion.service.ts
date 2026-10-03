import api from '../api';

export interface AccountDeletionStatus {
  pending: boolean;
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
}

/** Schedules deletion of the account and its data (30-day grace period). Needs the current password. */
export async function requestAccountDeletion(password: string) {
  const response = await api.post<{
    message: string;
    deletion_requested_at: string;
    deletion_scheduled_for: string;
  }>(
    '/users/me/deletion-request',
    { password },
    // A wrong password answers 401; the screen shows its own message instead
    // of the global "session expired" toast.
    { suppressErrorToast: true },
  );
  return response.data;
}

/** Cancels a pending deletion request (only possible before the grace period ends). */
export async function cancelAccountDeletion() {
  const response = await api.delete<{ message: string }>('/users/me/deletion-request');
  return response.data;
}

export async function getAccountDeletionStatus() {
  const response = await api.get<AccountDeletionStatus>('/users/me/deletion-request');
  return response.data;
}
