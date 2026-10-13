import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Content-Type map for fast image serving
const MIME_TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  avif: 'image/avif',
  ico: 'image/x-icon',
};

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;

    if (!segments || segments.length === 0) {
      return new NextResponse('Media path not specified', { status: 400 });
    }

    let bucket = 'images';
    let filePath = '';

    if (segments.length === 1) {
      filePath = decodeURIComponent(segments[0]);
    } else {
      bucket = decodeURIComponent(segments[0]);
      filePath = segments.slice(1).map(decodeURIComponent).join('/');
    }

    // Sanitize to prevent path traversal
    if (filePath.includes('..')) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    // Fetch image from Supabase Storage on the server
    const { data, error } = await supabase.storage.from(bucket).download(filePath);

    if (error || !data) {
      // Fallback: If not found in this bucket and bucket wasn't 'images', try default 'images' bucket
      if (bucket !== 'images') {
        const fallback = await supabase.storage.from('images').download(filePath);
        if (!fallback.error && fallback.data) {
          const buffer = await fallback.data.arrayBuffer();
          const contentType = fallback.data.type || getMimeType(filePath);
          return new Response(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'X-Content-Type-Options': 'nosniff',
            },
          });
        }
      }

      return new NextResponse('Media not found', { status: 404 });
    }

    const buffer = await data.arrayBuffer();
    const contentType = data.type || getMimeType(filePath);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('Media proxy error:', err);
    return new NextResponse('Internal error loading media', { status: 500 });
  }
}
