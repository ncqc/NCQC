import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { competitionsData } from '@/data/competitions';

export async function POST() {
  try {
    // 1. Check if Supabase allows select on table competition
    const { data: existingRows, error: selectError } = await supabase
      .from('competition')
      .select('slug');

    if (selectError) {
      return NextResponse.json({
        success: false,
        rlsBlocked: true,
        error: selectError.message,
        hint: selectError.hint || 'Disable RLS on table "competition" in Supabase Studio.'
      }, { status: 403 });
    }

    const currentLocalSlugs = new Set(competitionsData.map(c => c.slug?.trim()));
    const existingSlugs = (existingRows || []).map((r: any) => r.slug?.trim()).filter(Boolean);

    // 2. Delete rows in Supabase that are no longer in competitionsData (ignoring system settings)
    const slugsToDelete = existingSlugs.filter(slug => !currentLocalSlugs.has(slug) && slug !== '__site_settings__');
    for (const slug of slugsToDelete) {
      const { error: delErr } = await supabase.from('competition').delete().eq('slug', slug);
      if (delErr) console.error('Error deleting slug from Supabase:', slug, delErr.message);
    }

    // 3. Upsert current local competitions into Supabase
    const upserted = [];
    for (const comp of competitionsData.filter(c => c.slug !== '__site_settings__')) {
      const { isStarred: _unusedStar, ...cleanComp } = { ...comp, slug: comp.slug.trim() };
      const { error: upErr } = await supabase
        .from('competition')
        .upsert(cleanComp, { onConflict: 'slug' });
      if (upErr) {
        console.error('Error upserting to Supabase:', cleanComp.slug, upErr.message);
      } else {
        upserted.push(cleanComp.slug);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced! ${upserted.length} competitions updated, ${slugsToDelete.length} removed from Supabase.`,
      synced: upserted,
      deletedFromSupabase: slugsToDelete
    });
  } catch (err: any) {
    console.error('Sync error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
