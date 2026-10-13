import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Album } from '@/data/gallery';
import { maskImageUrl } from '@/utils/media';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const { data, error } = await supabase
        .from('gallery_album')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: 'Album not found' }, { status: 404 });
      }

      const album: Album = {
        ...(data as Album),
        coverImage: maskImageUrl(data.coverImage),
        photos: (data.photos || []).map(maskImageUrl),
      };

      return NextResponse.json({ success: true, data: album });
    }

    // Load all albums
    const { data: albumData, error: albumError } = await supabase
      .from('gallery_album')
      .select('*')
      .order('date', { ascending: false });

    // Load hero images
    const { data: heroData } = await supabase
      .from('gallery_hero')
      .select('*')
      .eq('id', 1)
      .single();

    const albums = (albumData || []).map((a: Album) => ({
      ...a,
      coverImage: maskImageUrl(a.coverImage),
      photos: (a.photos || []).map(maskImageUrl),
    }));

    const heroImages = (heroData?.images || [
      "https://picsum.photos/400/500?random=11",
      "https://picsum.photos/400/500?random=12",
      "https://picsum.photos/400/500?random=13",
      "https://picsum.photos/400/500?random=14",
      "https://picsum.photos/400/500?random=15",
      "https://picsum.photos/400/500?random=16"
    ]).map(maskImageUrl);

    return NextResponse.json({
      success: true,
      data: {
        albums,
        heroImages,
      },
    });
  } catch (error: any) {
    console.error('Gallery GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (payload.type === 'hero' || Array.isArray(payload.images)) {
      const images = payload.images || [];
      const { error } = await supabase
        .from('gallery_hero')
        .upsert({ id: 1, images }, { onConflict: 'id' });

      if (error) {
        console.error('Hero images save error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Album save / upsert
    const albumData = payload.album || payload;
    if (!albumData || !albumData.slug) {
      return NextResponse.json({ success: false, error: 'Slug is required for album' }, { status: 400 });
    }

    const { id, ...dataToSave } = albumData;
    const cleanAlbum = { ...dataToSave, slug: albumData.slug.trim() };

    const { data, error } = await supabase
      .from('gallery_album')
      .upsert(cleanAlbum, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error('Gallery album upsert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Gallery POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('gallery_album')
      .delete()
      .eq('slug', slug.trim());

    if (error) {
      console.error('Gallery delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Gallery DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
