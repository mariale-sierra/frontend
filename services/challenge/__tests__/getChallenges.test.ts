import api from '../../api';
import { getChallenges } from '../challenge.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;

describe('getChallenges (B1 cursor pagination)', () => {
  beforeEach(() => mockedGet.mockReset());

  it('follows X-Next-Cursor until the last page', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: [{ id: 'a' }, { id: 'b' }], headers: { 'x-next-cursor': 'c1' } })
      .mockResolvedValueOnce({ data: [{ id: 'c' }], headers: {} });

    const result = await getChallenges();

    expect(result.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(mockedGet).toHaveBeenNthCalledWith(1, '/challenges', { params: { limit: 50 } });
    expect(mockedGet).toHaveBeenNthCalledWith(2, '/challenges', { params: { limit: 50, cursor: 'c1' } });
  });

  it('still accepts the old unpaginated / enveloped shapes', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [{ id: 'x' }] }, headers: {} });
    expect((await getChallenges()).map((c) => c.id)).toEqual(['x']);
  });

  it('stops on a cursor that does not move', async () => {
    mockedGet.mockResolvedValue({ data: [{ id: 'a' }], headers: { 'x-next-cursor': 'same' } });
    await getChallenges();
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});
