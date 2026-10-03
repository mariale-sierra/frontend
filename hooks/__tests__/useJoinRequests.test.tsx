import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useJoinRequests } from '../useJoinRequests';
import { useChallengeJoinRequests } from '../useChallengeJoinRequests';
import { useSpaceJoinRequests } from '../useSpaceJoinRequests';
import { getChallengeJoinRequests } from '../../services/challenge/challenge.service';
import { getSpaceJoinRequests } from '../../services/spaces/spaces.service';

// Runs the focus effect when the hook mounts, as focusing the screen would.
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../services/challenge/challenge.service', () => ({ getChallengeJoinRequests: jest.fn() }));
jest.mock('../../services/spaces/spaces.service', () => ({ getSpaceJoinRequests: jest.fn() }));

const request = (id: string) => ({ id, user: { username: `user-${id}` } });

describe('useJoinRequests', () => {
  it('fetches the requests for an id, loading until they arrive', async () => {
    let arrive: (requests: ReturnType<typeof request>[]) => void = () => undefined;
    const fetchRequests = jest.fn().mockReturnValue(new Promise((resolve) => (arrive = resolve)));
    const { result } = await renderHook(() => useJoinRequests<ReturnType<typeof request>>('thing-1', fetchRequests));

    expect(result.current.loading).toBe(true);
    expect(result.current.requests).toEqual([]);

    await act(async () => arrive([request('1'), request('2')]));
    expect(result.current.loading).toBe(false);

    expect(fetchRequests).toHaveBeenCalledWith('thing-1');
    expect(result.current.requests.map((r) => r.id)).toEqual(['1', '2']);
    expect(result.current.error).toBe(false);
  });

  it('is an error, with nothing listed, when the fetch fails', async () => {
    const fetchRequests = jest.fn().mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useJoinRequests<ReturnType<typeof request>>('thing-1', fetchRequests));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.requests).toEqual([]);
  });

  it('asks nothing of no id, and is not loading: there is nothing to wait for', async () => {
    const fetchRequests = jest.fn();
    const { result } = await renderHook(() => useJoinRequests(null, fetchRequests));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchRequests).not.toHaveBeenCalled();
    expect(result.current.requests).toEqual([]);
  });

  it('fetches again on `reload`, and clears an earlier error', async () => {
    const fetchRequests = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([request('9')]);
    const { result } = await renderHook(() => useJoinRequests<ReturnType<typeof request>>('thing-1', fetchRequests));
    await waitFor(() => expect(result.current.error).toBe(true));

    await act(async () => result.current.reload());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchRequests).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe(false);
    expect(result.current.requests.map((r) => r.id)).toEqual(['9']);
  });

  it('fetches again for another id', async () => {
    const fetchRequests = jest.fn().mockResolvedValue([]);
    const { rerender } = await renderHook(({ id }: { id: string | null }) => useJoinRequests(id, fetchRequests), {
      initialProps: { id: null as string | null },
    });

    await rerender({ id: 'thing-2' });

    await waitFor(() => expect(fetchRequests).toHaveBeenCalledWith('thing-2'));
  });
});

describe('the two hooks it is made into', () => {
  beforeEach(() => jest.clearAllMocks());

  it("useSpaceJoinRequests reads a Space's requests", async () => {
    (getSpaceJoinRequests as jest.Mock).mockResolvedValue([request('s1')]);
    const { result } = await renderHook(() => useSpaceJoinRequests('space-1'));

    await waitFor(() => expect(result.current.requests).toHaveLength(1));

    expect(getSpaceJoinRequests).toHaveBeenCalledWith('space-1');
    expect(getChallengeJoinRequests).not.toHaveBeenCalled();
  });

  it("useChallengeJoinRequests reads a challenge's requests", async () => {
    (getChallengeJoinRequests as jest.Mock).mockResolvedValue([request('c1'), request('c2')]);
    const { result } = await renderHook(() => useChallengeJoinRequests('challenge-1'));

    await waitFor(() => expect(result.current.requests).toHaveLength(2));

    expect(getChallengeJoinRequests).toHaveBeenCalledWith('challenge-1');
    expect(getSpaceJoinRequests).not.toHaveBeenCalled();
  });

  it('are not a second copy of the logic: neither has state of its own', async () => {
    const source = jest.requireActual('fs').readFileSync(require.resolve('../useChallengeJoinRequests'), 'utf8');

    expect(source).not.toContain('useState');
  });
});

