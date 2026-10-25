import api from '../../api';
import { normalizeUploadMimeType, uploadImageAsync } from '../upload.service';
import { logWarn } from '../../../utils/apiError';

jest.mock('../../api', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('../../../utils/apiError', () => ({ logWarn: jest.fn() }));

const post = api.post as jest.Mock;
const SIGNED = 'https://r2.example.com/u/1/photo.jpg?X-Amz-Signature=secret';
const PUBLIC = 'https://cdn.example.com/u/1/photo.jpg';

const FAKE_BLOB = { size: 204800 };

// B5 — CP6: the gallery picker can return PNG/WebP, not just JPEG — this
// must declare whatever was really picked instead of always claiming JPEG.
describe('normalizeUploadMimeType', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'] as const)(
    'trusts a reported %s as-is',
    (mime) => {
      expect(normalizeUploadMimeType(mime)).toBe(mime);
    },
  );

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeUploadMimeType('  IMAGE/PNG  ')).toBe('image/png');
  });

  it.each([undefined, null, '', 'image/heic', 'application/octet-stream'])(
    'falls back to image/jpeg for an unsupported or missing type (%s)',
    (mime) => {
      expect(normalizeUploadMimeType(mime)).toBe('image/jpeg');
    },
  );
});

describe('uploadImageAsync', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('file://') ? { blob: async () => FAKE_BLOB } : { ok: true, status: 200 },
    );
  });

  // B5/CP1: the real byte size now has to be read from the blob BEFORE
  // /uploads/sign is called (the backend rejects an oversized fileSize and
  // signs this exact Content-Length), and the PUT must carry the matching
  // Content-Type header (the backend now signs it too).
  // B5/CP2: the backend also signs If-None-Match: '*' (blocks a second PUT to
  // an already-written key), so the PUT must send that header too or the
  // signature is invalid.
  it('signs with the real fileSize, PUTs with the matching Content-Type and If-None-Match, and returns the public URL', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });

    await expect(uploadImageAsync('file:///photo.jpg')).resolves.toBe(PUBLIC);

    expect(post).toHaveBeenCalledWith('/uploads/sign', {
      fileType: 'image/jpeg',
      fileSize: FAKE_BLOB.size,
    });
    expect(fetchMock).toHaveBeenLastCalledWith(SIGNED, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg', 'If-None-Match': '*' },
      body: FAKE_BLOB,
    });
  });

  it('accepts the nested { data: { signedUrl, publicUrl } } shape', async () => {
    post.mockResolvedValue({ data: { data: { signedUrl: SIGNED, publicUrl: PUBLIC } } });

    await expect(uploadImageAsync('file:///photo.jpg', 'image/png')).resolves.toBe(PUBLIC);
    expect(post).toHaveBeenCalledWith('/uploads/sign', {
      fileType: 'image/png',
      fileSize: FAKE_BLOB.size,
    });
  });

  // B5 — CP6: webp is one of the three backend-allowed types (see
  // normalizeUploadMimeType's own doc comment) — never wired up before.
  it('uploads a webp file with the matching Content-Type', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });

    await expect(uploadImageAsync('file:///photo.webp', 'image/webp')).resolves.toBe(
      PUBLIC,
    );
    expect(post).toHaveBeenCalledWith('/uploads/sign', {
      fileType: 'image/webp',
      fileSize: FAKE_BLOB.size,
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      SIGNED,
      expect.objectContaining({
        headers: { 'Content-Type': 'image/webp', 'If-None-Match': '*' },
      }),
    );
  });

  it('sends the Content-Type matching whichever fileType was requested, not a fixed value', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });

    await uploadImageAsync('file:///photo.png', 'image/png');

    expect(fetchMock).toHaveBeenLastCalledWith(
      SIGNED,
      expect.objectContaining({
        headers: { 'Content-Type': 'image/png', 'If-None-Match': '*' },
      }),
    );
  });

  it('reads the blob before signing, so fileSize is always known when /uploads/sign is called', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });

    await uploadImageAsync('file:///photo.jpg');

    const blobCallOrder = fetchMock.mock.invocationCallOrder[0];
    const postCallOrder = post.mock.invocationCallOrder[0];
    expect(blobCallOrder).toBeLessThan(postCallOrder);
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
      url.startsWith('file://') ? { blob: async () => FAKE_BLOB } : { ok: false, status: 403 },
    );

    await expect(uploadImageAsync('file:///photo.jpg')).rejects.toThrow('Image PUT failed with status 403');
    const logged = JSON.stringify((logWarn as jest.Mock).mock.calls);
    expect(logged).toContain('403');
    expect(logged).not.toContain('X-Amz-Signature');
    expect(logged).not.toContain(SIGNED);
  });

  // B5 — CP7, abuse-matrix item "reutilización de URLs PUT con
  // If-None-Match: *": this is the client side of that test. R2 itself
  // enforcing the precondition (returning 412 on a second PUT to the same
  // key) can only be proven for real against R2 (CP0, not authorized here)
  // — see uploads.service.spec.ts's "also signs If-None-Match: * among the
  // signed headers" for what's verified locally on the signing side. This
  // only proves the app sends that header on every PUT (so there IS
  // something for R2 to enforce) and fails safely, without retrying or
  // silently treating a blocked reuse as success, if R2 ever does reject it.
  it('sends If-None-Match on every PUT and fails safely (no retry, no silent success) if R2 rejects a reused key with 412', async () => {
    post.mockResolvedValue({ data: { signedUrl: SIGNED, publicUrl: PUBLIC } });
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('file://')
        ? { blob: async () => FAKE_BLOB }
        : { ok: false, status: 412 },
    );

    await expect(uploadImageAsync('file:///photo.jpg')).rejects.toThrow(
      'Image PUT failed with status 412',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2); // blob read + exactly one PUT, no retry
    expect(fetchMock).toHaveBeenLastCalledWith(
      SIGNED,
      expect.objectContaining({
        headers: expect.objectContaining({ 'If-None-Match': '*' }),
      }),
    );
  });
});
