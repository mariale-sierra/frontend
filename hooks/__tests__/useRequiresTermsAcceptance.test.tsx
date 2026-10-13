import { act, renderHook, waitFor } from '@testing-library/react-native';
import { markTermsAccepted, useRequiresTermsAcceptance } from '../useRequiresTermsAcceptance';
import { getMe } from '../../services/user/user.service';

let mockAuthenticated = true;
jest.mock('../useAuth', () => ({ useAuth: () => ({ isAuthenticated: mockAuthenticated }) }));
jest.mock('../../services/user/user.service', () => ({ getMe: jest.fn() }));

describe('useRequiresTermsAcceptance', () => {
  beforeEach(() => {
    mockAuthenticated = true;
    (getMe as jest.Mock).mockReset();
  });

  it('reports pending terms from GET /users/me', async () => {
    (getMe as jest.Mock).mockResolvedValue({ requires_terms_acceptance: true });
    const { result } = await renderHook(() => useRequiresTermsAcceptance());
    await waitFor(() => expect(result.current).toBe(true));
  });

  // The reported loop: after accepting, the root layout (another hook
  // instance) kept seeing `true` and redirected back to /accept-terms.
  it('is cleared for every reader as soon as the terms are accepted', async () => {
    (getMe as jest.Mock).mockResolvedValue({ requires_terms_acceptance: true });
    const root = await renderHook(() => useRequiresTermsAcceptance());
    await waitFor(() => expect(root.result.current).toBe(true));

    await act(async () => markTermsAccepted());

    expect(root.result.current).toBe(false);
    // No refetch needed (and none that could bring it back).
    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it("doesn't lock anyone out when the lookup fails", async () => {
    (getMe as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useRequiresTermsAcceptance());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('is unknown (null) while signed out', async () => {
    mockAuthenticated = false;
    const { result } = await renderHook(() => useRequiresTermsAcceptance());
    expect(result.current).toBeNull();
    expect(getMe).not.toHaveBeenCalled();
  });
});
