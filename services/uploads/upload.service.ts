import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../api';
import { logWarn } from '../../utils/apiError';

type SignResponse = { signedUrl: string; publicUrl: string };

/** Matches the backend's ALLOWED_UPLOAD_FILE_TYPES (sign-upload.dto.ts). */
export type UploadableImageType = 'image/jpeg' | 'image/png' | 'image/webp';

const ALLOWED_UPLOAD_TYPES: readonly UploadableImageType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * B5/CP6: turns whatever ImagePicker/the camera reports (or undefined, on a
 * platform/SDK version that doesn't report one) into a type the backend
 * actually accepts, instead of always hardcoding 'image/jpeg' regardless of
 * what was really picked. Only trusts `reportedMimeType` when it's one of
 * the three the backend signs for; anything else (e.g. iOS HEIC that wasn't
 * converted) falls back to 'image/jpeg' — a declared type this function
 * can't make honest on its own, but CP2's magic-byte check on the backend
 * still catches a real mismatch after upload, same as it always has.
 */
export function normalizeUploadMimeType(
  reportedMimeType: string | null | undefined,
): UploadableImageType {
  const normalized = reportedMimeType?.toLowerCase().trim();
  return (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(
    normalized ?? '',
  )
    ? (normalized as UploadableImageType)
    : 'image/jpeg';
}

function extractSignedUrls(data: unknown): SignResponse {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;

    // Shape: { signedUrl, publicUrl }
    if (typeof d.signedUrl === 'string' && typeof d.publicUrl === 'string') {
      return { signedUrl: d.signedUrl, publicUrl: d.publicUrl };
    }

    // Shape: { data: { signedUrl, publicUrl } }
    if (d.data && typeof d.data === 'object') {
      const nested = d.data as Record<string, unknown>;
      if (typeof nested.signedUrl === 'string' && typeof nested.publicUrl === 'string') {
        return { signedUrl: nested.signedUrl, publicUrl: nested.publicUrl };
      }
    }
  }

  logWarn('uploadImageAsync', 'unexpected /uploads/sign response shape');
  throw new Error('Invalid signed upload URL received.');
}

export async function uploadImageAsync(
  localUri: string,
  fileType: UploadableImageType = 'image/jpeg',
): Promise<string> {
  // Step 1: the real byte size first — B5/CP1: the backend rejects an
  // oversized fileSize and signs this exact Content-Length, so it has to be
  // known before asking for the signed URL.
  const source = await readLocalFile(localUri);

  // Step 2: request a signed upload URL from the backend, declaring the real size
  const signRes = await api.post<unknown>('/uploads/sign', {
    fileType,
    fileSize: source.size,
  });
  const { signedUrl, publicUrl } = extractSignedUrls(signRes.data);

  if (!signedUrl || signedUrl === publicUrl) {
    throw new Error('Invalid signed upload URL received.');
  }

  // Step 3: PUT the bytes directly to the signed URL — never through `api`,
  // which would inject Authorization + baseURL, both break pre-signed URLs.
  // B5/CP1: the backend signs Content-Type (via an explicit `signableHeaders`
  // override — @aws-sdk/s3-request-presigner treats content-type as unsignable by
  // default) alongside Content-Length, so both must now match exactly or the
  // signature is invalid.
  // B5/CP2: the backend also signs If-None-Match: '*' (R2 rejects a PUT to a key
  // that already has an object, per Cloudflare's docs) to block replacing an
  // already-validated upload with different bytes. The key is always brand new, so
  // this never blocks a legitimate first upload — only a second PUT to the same key.
  // Neither header is optional: the signature covers both, same as Content-Type.
  const headers = { 'Content-Type': fileType, 'If-None-Match': '*' };
  const putRes = source.blob
    ? await fetch(signedUrl, { method: 'PUT', headers, body: source.blob })
    : await putFileNatively(signedUrl, localUri, headers);

  if (!putRes.ok) {
    // Only the status and the storage error code (e.g. SignatureDoesNotMatch,
    // AccessDenied), which tells a broken signature from a permissions problem.
    // The signed URL is a credential, and the rest of the provider's error body
    // can echo the signed request back, so neither is ever logged.
    const code = await readStorageErrorCode(putRes);
    const detail = code ? ` (${code})` : '';
    logWarn('uploadImageAsync', `PUT to storage failed with status ${putRes.status}${detail}`);
    throw new Error(`Image PUT failed with status ${putRes.status}${detail}`);
  }

  return publicUrl;
}

type LocalFile = { size: number; blob?: Blob };

/**
 * The file to upload and its size. On iOS/Android the file is sent natively
 * from disk (see putFileNatively), so its size comes from the file system —
 * the same bytes the PUT will carry. Sprint 10 fix: reading the file into a JS
 * Blob and PUTting that with fetch failed on iOS (Expo Go) with 403
 * SignatureDoesNotMatch — what iOS sent didn't match the signed headers
 * (Content-Length is the one that depends on how the body is built). A native
 * upload from the file sends the file's own length. Web keeps the Blob (no
 * file system there; the browser sends exactly the blob it is given).
 */
async function readLocalFile(localUri: string): Promise<LocalFile> {
  if (Platform.OS !== 'web') {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists && typeof info.size === 'number' && info.size > 0) {
      return { size: info.size };
    }
  }
  const blob = await (await fetch(localUri)).blob();
  return { size: blob.size, blob };
}

/** PUT the file straight from disk (a native upload task), with exactly these headers. */
async function putFileNatively(
  signedUrl: string,
  localUri: string,
  headers: Record<string, string>,
): Promise<{ ok: boolean; status: number; text: () => Promise<string> }> {
  const result = await FileSystem.uploadAsync(signedUrl, localUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers,
  });
  return {
    ok: result.status >= 200 && result.status < 300,
    status: result.status,
    text: async () => result.body ?? '',
  };
}

/** `<Code>…</Code>` from an S3/R2 XML error body, or null. */
async function readStorageErrorCode(res: { text?: () => Promise<string> }): Promise<string | null> {
  try {
    const body = typeof res.text === 'function' ? await res.text() : '';
    const match = /<Code>([A-Za-z]{1,64})<\/Code>/.exec(body);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
