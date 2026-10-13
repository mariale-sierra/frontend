import api from '../../api';
import { deleteRoutine } from '../routine.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('routine.service — deleteRoutine (B4)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the routine by its backend id', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await deleteRoutine(12);

    expect(mockedApi.delete).toHaveBeenCalledWith('/routine/12');
  });

  it('propagates API errors to the caller', async () => {
    mockedApi.delete.mockRejectedValue(new Error('Forbidden'));

    await expect(deleteRoutine(12)).rejects.toThrow('Forbidden');
  });
});
