import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Project, projectsData } from '@/data/projects';
import { maskImageUrl } from '@/utils/media';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const { data, error } = await supabase
        .from('project')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        const fallback = projectsData.find(p => p.slug === slug);
        if (!fallback) {
          return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: { ...fallback, image: maskImageUrl(fallback.image) } });
      }

      return NextResponse.json({
        success: true,
        data: { ...data, image: maskImageUrl(data.image) }
      });
    }

    const { data, error } = await supabase
      .from('project')
      .select('*')
      .order('title', { ascending: true });

    if (error || !data) {
      return NextResponse.json({
        success: true,
        data: projectsData.map(p => ({ ...p, image: maskImageUrl(p.image) }))
      });
    }

    return NextResponse.json({
      success: true,
      data: (data as Project[]).map(p => ({ ...p, image: maskImageUrl(p.image) }))
    });
  } catch (error: any) {
    console.error('Projects GET error:', error);
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

    // Enforce max 3 starred projects on Home Page
    if (item.isStarred === true) {
      const { data: existingStarred } = await supabase
        .from('project')
        .select('slug')
        .eq('isStarred', true);

      const otherStarred = (existingStarred || []).filter((p: any) => p.slug !== cleanSlug);
      if (otherStarred.length >= 3) {
        return NextResponse.json({
          success: false,
          error: 'Maximum 3 projects can be featured on the Home Page. Please unstar an existing project first.'
        }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('project')
      .upsert(item, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error('Supabase project upsert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Projects POST error:', error);
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
      .from('project')
      .delete()
      .eq('slug', slug.trim());

    if (error) {
      console.error('Supabase project delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Projects DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
