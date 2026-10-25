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
  // Step 1: convert the local file URI to a blob first — the real byte size
  // (B5/CP1: backend now rejects an oversized fileSize and signs this exact
  // Content-Length) is only known once we have the blob, so this has to run
  // before asking for the signed URL.
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();

  // Step 2: request a signed upload URL from the backend, declaring the real size
  const signRes = await api.post<unknown>('/uploads/sign', {
    fileType,
    fileSize: blob.size,
  });
  const { signedUrl, publicUrl } = extractSignedUrls(signRes.data);

  if (!signedUrl || signedUrl === publicUrl) {
    throw new Error('Invalid signed upload URL received.');
  }

  // Step 3: PUT the blob directly to the signed URL
  // Must use native fetch — api would inject Authorization + baseURL, both break pre-signed URLs.
  // B5/CP1: the backend now signs Content-Type (via an explicit `signableHeaders`
  // override — @aws-sdk/s3-request-presigner treats content-type as unsignable by
  // default) alongside Content-Length, so this header must now match exactly or the
  // signature is invalid.
  // B5/CP2: the backend also signs If-None-Match: '*' (R2 rejects a PUT to a key
  // that already has an object, per Cloudflare's docs) to block replacing an
  // already-validated upload with different bytes. The key is always brand new, so
  // this never blocks a legitimate first upload — only a second PUT to the same key.
  // Neither header is optional: the signature covers both, same as Content-Type.
  const putRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': fileType, 'If-None-Match': '*' },
    body: blob,
  });

  if (!putRes.ok) {
    // Only the status: the signed URL is a credential, and the storage
    // provider's error body can echo it back.
    logWarn('uploadImageAsync', `PUT to storage failed with status ${putRes.status}`);
    throw new Error(`Image PUT failed with status ${putRes.status}`);
  }

  return publicUrl;
}
