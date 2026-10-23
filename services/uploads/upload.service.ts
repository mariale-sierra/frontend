import api from '../api';
import { logWarn } from '../../utils/apiError';

type SignResponse = { signedUrl: string; publicUrl: string };

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
  fileType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<string> {
  // Step 1: request a signed upload URL from the backend
  const signRes = await api.post<unknown>('/uploads/sign', { fileType });
  const { signedUrl, publicUrl } = extractSignedUrls(signRes.data);

  if (!signedUrl || signedUrl === publicUrl) {
    throw new Error('Invalid signed upload URL received.');
  }

  // Step 2: convert the local file URI to a blob
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();

  // Step 3: PUT the blob directly to the signed URL
  // Must use native fetch — api would inject Authorization + baseURL, both break pre-signed URLs.
  // No Content-Type header: R2 signed URLs encode the expected headers in the signature,
  // sending extra headers invalidates it and causes a 401.
  const putRes = await fetch(signedUrl, {
    method: 'PUT',
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
