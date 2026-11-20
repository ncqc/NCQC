import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.media-cache');

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {}
}

function saveLocalCache(fileName: string, buffer: Buffer) {
  try {
    ensureCacheDir();
    const diskPath = path.join(CACHE_DIR, `images_${fileName}`);
    fs.writeFileSync(diskPath, buffer);
  } catch (e) {
    console.warn('Local disk cache write notice:', e);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    const originalName = file.name || 'uploaded-file';
    const originalType = file.type || '';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    const isImage = originalType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp'].includes(ext);
    const isPdf = originalType === 'application/pdf' || ext === 'pdf';

    let finalBuffer: Buffer;
    let contentType: string;
    let fileName: string;
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    if (isImage) {
      // Compress and optimize image to WebP with Sharp for minimal size and high quality
      try {
        finalBuffer = await sharp(originalBuffer)
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
        contentType = 'image/webp';
        fileName = `img-${Date.now()}-${randomSuffix}.webp`;
      } catch (sharpError) {
        // Fallback to original buffer if sharp fails (e.g. SVG or unconventional image)
        console.warn('Sharp compression warning:', sharpError);
        finalBuffer = originalBuffer;
        contentType = originalType || 'image/png';
        fileName = `img-${Date.now()}-${randomSuffix}.${ext || 'png'}`;
      }
    } else if (isPdf) {
      finalBuffer = originalBuffer;
      contentType = 'application/pdf';
      fileName = `doc-${Date.now()}-${randomSuffix}.pdf`;
    } else {
      finalBuffer = originalBuffer;
      contentType = originalType || 'application/octet-stream';
      fileName = `file-${Date.now()}-${randomSuffix}.${ext || 'bin'}`;
    }

    // 1. Immediately cache locally for ultra-fast local preview and resilient offline mode
    saveLocalCache(fileName, finalBuffer);

    // 2. Upload to Supabase Storage bucket 'images'
    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, finalBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.warn('Supabase storage upload notice (using local cache fallback):', uploadError.message);
      }
    } catch (sbErr) {
      console.warn('Supabase network notice:', sbErr);
    }

    // Return masked media proxy URL
    const maskedUrl = `/api/media/images/${fileName}`;

    return NextResponse.json({
      success: true,
      url: maskedUrl,
      fileName,
      originalName,
      isImage,
      isPdf,
      size: finalBuffer.length
    });
  } catch (error: any) {
    console.error('Upload API route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
