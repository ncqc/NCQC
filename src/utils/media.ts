/**
 * Utility for masking and sanitizing image URLs
 * Ensures no direct Supabase storage links or cloud bucket URLs are leaked to the browser.
 */

const SUPABASE_PROJECT_DOMAIN = 'iwjnbreeazxvbzxelnzj.supabase.co';

export function maskImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '/bar.png';

  const trimmed = url.trim();

  // If it's already a masked media API path or local asset, return as-is
  if (trimmed.startsWith('/api/media/') || trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Check if it's a Supabase storage URL
  // e.g. https://<project>.supabase.co/storage/v1/object/public/images/<filename>
  if (trimmed.includes(SUPABASE_PROJECT_DOMAIN) || trimmed.includes('/storage/v1/object/public/images/')) {
    const parts = trimmed.split('/storage/v1/object/public/images/');
    if (parts.length > 1) {
      const fileName = parts[1].split('?')[0]; // strip any query params
      return `/api/media/images/${fileName}`;
    }
  }

  // Any other Supabase storage bucket pattern
  const match = trimmed.match(/https?:\/\/[^\/]+\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
  if (match) {
    const bucket = match[1];
    const path = match[2].split('?')[0];
    return `/api/media/${bucket}/${path}`;
  }

  return trimmed;
}
