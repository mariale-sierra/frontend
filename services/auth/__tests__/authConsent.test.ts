import api from '../../api';
import { acceptTerms, register } from '../auth.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));
jest.mock('../token.service', () => ({
  setAccessToken: jest.fn(),
  clearAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
}));
jest.mock('../../../utils/storage', () => ({
  storage: { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() },
}));

const post = api.post as jest.Mock;

describe('auth service — legal consent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends acceptTerms and confirmAge16 with the registration', async () => {
    post.mockResolvedValue({ data: { accessToken: 't', user: { id: '1', username: 'u' } } });

    await register('a@b.com', 'user', 'password123', { acceptTerms: true, confirmAge16: true });

    expect(post).toHaveBeenCalledWith('/auth/register', {
      email: 'a@b.com',
      username: 'user',
      password: 'password123',
      acceptTerms: true,
      confirmAge16: true,
    });
  });

  it('posts the consent to /auth/accept-terms for existing accounts', async () => {
    post.mockResolvedValue({ data: { message: 'Terms accepted' } });

    await acceptTerms({ acceptTerms: true, confirmAge16: true });

    expect(post).toHaveBeenCalledWith('/auth/accept-terms', {
      acceptTerms: true,
      confirmAge16: true,
    });
  });
});
