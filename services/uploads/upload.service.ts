import api from '../api';

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

  console.error('[uploadImageAsync] unexpected /uploads/sign shape:', data);
  throw new Error('Invalid signed upload URL received.');
}

export async function uploadImageAsync(
  localUri: string,
  fileType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<string> {
  // Step 1: request a signed upload URL from the backend
  const signRes = await api.post<unknown>('/uploads/sign', { fileType });

  console.log('[uploadImageAsync] /uploads/sign status:', signRes.status);
  console.log('[uploadImageAsync] /uploads/sign response.data:', signRes.data);

  const { signedUrl, publicUrl } = extractSignedUrls(signRes.data);

  console.log('[uploadImageAsync] signedUrl (first 120):', signedUrl?.slice(0, 120));
  console.log('[uploadImageAsync] publicUrl:', publicUrl);
  console.log('[uploadImageAsync] localUri:', localUri);
  console.log('[uploadImageAsync] fileType used to sign:', fileType);

  if (!signedUrl || signedUrl === publicUrl) {
    throw new Error('Invalid signed upload URL received.');
  }

  // Step 2: convert the local file URI to a blob
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  console.log('[uploadImageAsync] blob size:', blob.size, '| blob type:', blob.type);

  // Step 3: PUT the blob directly to the signed URL
  // Must use native fetch — api would inject Authorization + baseURL, both break pre-signed URLs.
  const putHeaders = { 'Content-Type': fileType };
  console.log('[uploadImageAsync] PUT headers:', putHeaders);
  console.log('[uploadImageAsync] PUT to signedUrl domain:', signedUrl.split('/').slice(0, 3).join('/'));

  const putRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: blob,
  });

  console.log('[uploadImageAsync] PUT status:', putRes.status);

  if (!putRes.ok) {
    const putBody = await putRes.text().catch(() => '(could not read body)');
    console.error('[uploadImageAsync] PUT failed — status:', putRes.status);
    console.error('[uploadImageAsync] PUT failed — response body:', putBody);
    throw new Error(`Image PUT failed with status ${putRes.status}`);
  }

  console.log('[uploadImageAsync] upload success — publicUrl:', publicUrl);
  return publicUrl;
}
