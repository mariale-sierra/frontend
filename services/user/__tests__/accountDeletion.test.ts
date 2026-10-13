import api from '../../api';
import {
  cancelAccountDeletion,
  getAccountDeletionStatus,
  requestAccountDeletion,
} from '../accountDeletion.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), delete: jest.fn() },
}));

describe('account deletion service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requests deletion with the password, silencing the 401 toast and the session logout', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { message: 'ok' } });

    await requestAccountDeletion('secret123');

    expect(api.post).toHaveBeenCalledWith(
      '/users/me/deletion-request',
      { password: 'secret123' },
      { suppressErrorToast: true, skipSessionExpiredLogout: true },
    );
  });

  it('cancels a pending request', async () => {
    (api.delete as jest.Mock).mockResolvedValue({ data: { message: 'cancelled' } });
    await cancelAccountDeletion();
    expect(api.delete).toHaveBeenCalledWith('/users/me/deletion-request');
  });

  it('reads the status', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { pending: true, deletion_requested_at: 'a', deletion_scheduled_for: 'b' },
    });
    const status = await getAccountDeletionStatus();
    expect(status.pending).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/users/me/deletion-request');
  });
});
