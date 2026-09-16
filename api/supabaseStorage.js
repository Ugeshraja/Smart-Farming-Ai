/**
 * SmartFarm AI - Persistent Supabase Storage Service
 * Handles uploading original leaf images to Supabase Storage server-side.
 * Never exposes SUPABASE_SERVICE_ROLE_KEY to client.
 */

export async function uploadLeafImageToSupabase(imageBuffer, filename = 'leaf.jpg', mimeType = 'image/jpeg') {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'predictions';

  if (!supabaseUrl || !serviceKey) {
    console.warn('[Supabase Storage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured. Skipping image upload.');
    return {
      success: false,
      reason: 'storage_not_configured',
      url: null,
      message: 'Supabase Storage is not configured in server environment variables.',
    };
  }

  const cleanBaseUrl = supabaseUrl.replace(/\/+$/, '');
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `leaves/${timestamp}_${safeName}`;
  const uploadUrl = `${cleanBaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: imageBuffer,
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 404) {
      console.error(`[Supabase Storage] Bucket "${bucket}" does not exist in project. Please create bucket "${bucket}" with Public access in Supabase Dashboard.`);
      return {
        success: false,
        reason: 'storage_bucket_not_found',
        url: null,
        message: `Supabase bucket "${bucket}" not found. Please create the bucket in Supabase.`,
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Supabase Storage] Upload failed with status ${res.status}: ${errText}`);
      return {
        success: false,
        reason: 'storage_unavailable',
        url: null,
        message: `Supabase upload failed: HTTP ${res.status}`,
      };
    }

    const publicUrl = `${cleanBaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
    return {
      success: true,
      url: publicUrl,
      path: storagePath,
    };
  } catch (error) {
    console.error('[Supabase Storage] Error during upload:', error?.message || error);
    return {
      success: false,
      reason: 'storage_unavailable',
      url: null,
      message: `Supabase Storage upload error: ${error?.message || 'Connection error'}`,
    };
  }
}
