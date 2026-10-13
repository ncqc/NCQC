import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to WebP using sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 }) // 80% quality for good balance of size and visual fidelity
      .toBuffer();

    const fileName = `image-${Date.now()}.webp`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Return masked media proxy URL so no Supabase domain is ever exposed to client
    const maskedUrl = `/api/media/images/${fileName}`;

    return NextResponse.json({
      success: true,
      url: maskedUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('Upload API route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
