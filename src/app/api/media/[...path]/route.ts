import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

// Ultra-fast in-memory cache to eliminate repetitive network round-trips
const memoryCache = new Map<string, { buffer: Buffer; contentType: string }>();

// Local filesystem cache directory for persistent offline & reboot speed
const CACHE_DIR = path.join(process.cwd(), '.media-cache');

function getDiskCachePath(key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(CACHE_DIR, safeKey);
}

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {}
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

    // Sanitize to prevent path traversal and forbid directory browsing
    if (!filePath || filePath.trim() === '' || filePath.includes('..') || !filePath.includes('.')) {
      return new NextResponse('Direct media directory browsing is forbidden', { status: 403 });
    }

    const cacheKey = `${bucket}/${filePath}`;

    // 1. Check in-memory RAM cache (0ms lookup)
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      return new Response(cached.buffer as any, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Media-Cache': 'RAM-HIT',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // 2. Check local disk cache (1ms lookup)
    ensureCacheDir();
    const diskPath = getDiskCachePath(cacheKey);
    if (fs.existsSync(diskPath)) {
      try {
        const fileBuffer = fs.readFileSync(diskPath);
        const contentType = getMimeType(filePath);
        // Save to RAM for next request
        memoryCache.set(cacheKey, { buffer: fileBuffer, contentType });
        return new Response(fileBuffer as any, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Media-Cache': 'DISK-HIT',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch (e) {
        // Fall through to download if reading disk failed
      }
    }

    // 3. Fetch image from Supabase Storage on the server
    let downloadRes = await supabase.storage.from(bucket).download(filePath);

    if ((downloadRes.error || !downloadRes.data) && bucket !== 'images') {
      // Fallback: If not found in custom bucket, try default 'images' bucket
      downloadRes = await supabase.storage.from('images').download(filePath);
    }

    if (downloadRes.error || !downloadRes.data) {
      return new NextResponse('Media not found', { status: 404 });
    }

    const arrayBuf = await downloadRes.data.arrayBuffer();
    const nodeBuf = Buffer.from(arrayBuf);
    const contentType = downloadRes.data.type || getMimeType(filePath);

    // Save to memory cache & disk cache
    memoryCache.set(cacheKey, { buffer: nodeBuf, contentType });
    try {
      fs.writeFileSync(diskPath, nodeBuf);
    } catch {}

    return new Response(nodeBuf as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Media-Cache': 'MISS-CACHED',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  } catch (err: any) {
    console.error('Media proxy error:', err);
    return new NextResponse('Internal error loading media', { status: 500 });
  }
}
