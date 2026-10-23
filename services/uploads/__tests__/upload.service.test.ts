import api from '../../api';
import { uploadImageAsync } from '../upload.service';
import { logWarn } from '../../../utils/apiError';

jest.mock('../../api', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('../../../utils/apiError', () => ({ logWarn: jest.fn() }));

const post = api.post as jest.Mock;
const SIGNED = 'https://r2.example.com/u/1/photo.jpg?X-Amz-Signature=secret';
const PUBLIC = 'https://cdn.example.com/u/1/photo.jpg';

describe('uploadImageAsync', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('file://') ? { blob: async () => 'BLOB' } : { ok: true, status: 200 },
    );
  });

  it('signs, PUTs the file to the signed URL without extra headers and returns the public URL', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });

    await expect(uploadImageAsync('file:///photo.jpg')).resolves.toBe(PUBLIC);

    expect(post).toHaveBeenCalledWith('/uploads/sign', { fileType: 'image/jpeg' });
    expect(fetchMock).toHaveBeenLastCalledWith(SIGNED, { method: 'PUT', body: 'BLOB' });
  });

  it('accepts the nested { data: { signedUrl, publicUrl } } shape', async () => {
    post.mockResolvedValue({ data: { data: { signedUrl: SIGNED, publicUrl: PUBLIC } } });

    await expect(uploadImageAsync('file:///photo.jpg', 'image/png')).resolves.toBe(PUBLIC);
    expect(post).toHaveBeenCalledWith('/uploads/sign', { fileType: 'image/png' });
  });

  it('rejects an unexpected sign response, warning without its content', async () => {
    post.mockResolvedValue({ data: { url: SIGNED } });

    await expect(uploadImageAsync('file:///photo.jpg')).rejects.toThrow('Invalid signed upload URL received.');
    expect(logWarn).toHaveBeenCalledWith('uploadImageAsync', 'unexpected /uploads/sign response shape');
  });

  it('rejects a "signed" URL that is just the public one', async () => {
    post.mockResolvedValue({ data: { signedUrl: PUBLIC, publicUrl: PUBLIC } });

    await expect(uploadImageAsync('file:///photo.jpg')).rejects.toThrow('Invalid signed upload URL received.');
  });

  it('on a failed PUT, logs only the status — never the signed URL (a credential)', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('file://') ? { blob: async () => 'BLOB' } : { ok: false, status: 403 },
    );

    await expect(uploadImageAsync('file:///photo.jpg')).rejects.toThrow('Image PUT failed with status 403');
    const logged = JSON.stringify((logWarn as jest.Mock).mock.calls);
    expect(logged).toContain('403');
    expect(logged).not.toContain('X-Amz-Signature');
    expect(logged).not.toContain(SIGNED);
  });
});
