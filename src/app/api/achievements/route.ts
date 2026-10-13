import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Achievement, achievementsData } from '@/data/achievements';
import { maskImageUrl } from '@/utils/media';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const { data, error } = await supabase
        .from('achievement')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        const fallback = achievementsData.find(a => a.slug === slug);
        if (!fallback) {
          return NextResponse.json({ success: false, error: 'Achievement not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: { ...fallback, image: maskImageUrl(fallback.image) } });
      }

      return NextResponse.json({
        success: true,
        data: { ...data, image: maskImageUrl(data.image) }
      });
    }

    const { data, error } = await supabase
      .from('achievement')
      .select('*')
      .order('year', { ascending: false });

    if (error || !data) {
      return NextResponse.json({
        success: true,
        data: achievementsData.map(a => ({ ...a, image: maskImageUrl(a.image) }))
      });
    }

    return NextResponse.json({
      success: true,
      data: (data as Achievement[]).map(a => ({ ...a, image: maskImageUrl(a.image) }))
    });
  } catch (error: any) {
    console.error('Achievements GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload || !payload.slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const cleanSlug = payload.slug.trim();
    const { id, ...dataToSave } = payload;
    const item = { ...dataToSave, slug: cleanSlug };

    const { data, error } = await supabase
      .from('achievement')
      .upsert(item, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error('Supabase achievement upsert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Achievements POST error:', error);
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
      .from('achievement')
      .delete()
      .eq('slug', slug.trim());

    if (error) {
      console.error('Supabase achievement delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Achievements DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
