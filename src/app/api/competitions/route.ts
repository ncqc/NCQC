import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { competitionsData, Competition, getCompetitionsData } from '@/data/competitions';

import { getSiteSettings } from '@/data/settings';

function generateCompetitionsFileContent(list: Competition[]) {
  return `import { supabase } from '@/lib/supabase';
import { getSiteSettings } from '@/data/settings';

export interface Competition {
  slug: string;
  title: string;
  date: string;
  eventDate?: string;
  deadline?: string;
  shortDesc: string;
  fullDesc: string[];
  image: string;
  contentHtml?: string;
  rulesButtonText?: string;
  rulesButtonLink?: string;
  submissionsButtonText?: string;
  submissionsButtonLink?: string;
  customButtons?: { text: string; link: string; color: string }[] | null;
  sidebarWidget?: {
    enabled: boolean;
    title: string;
    value: string;
    buttonText: string;
    buttonLink: string;
  } | null;
  isStarred?: boolean;
  id?: any;
  created_at?: string;
}

export const competitionsData: Competition[] = ${JSON.stringify(list, null, 2)};

export async function getCompetitionsData(): Promise<Competition[]> {
  const settings = getSiteSettings();
  const starredSlugs = new Set(settings.starredCompetitionSlugs || []);

  try {
    const { data, error } = await supabase
      .from('competition')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as Competition[]).map(c => ({
        ...c,
        isStarred: starredSlugs.has(c.slug) || (c.isStarred === true)
      }));
    }
  } catch (e) {
    console.error('Supabase fetch error for competitions, using fallback:', e);
  }
  return competitionsData.map(c => ({
    ...c,
    isStarred: starredSlugs.has(c.slug) || (c.isStarred === true)
  }));
}

export async function getCompetition(slug: string): Promise<Competition | null> {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const slugified = decoded.replace(/\\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  const settings = getSiteSettings();
  const starredSlugs = new Set(settings.starredCompetitionSlugs || []);

  try {
    const { data, error } = await supabase
      .from('competition')
      .select('*');

    if (!error && data && data.length > 0) {
      const match = (data as Competition[]).find((c) => {
        const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
        const cSlugified = cDecoded.replace(/\\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
        return cDecoded === decoded || cSlugified === slugified || (c.slug && c.slug.trim() === slug.trim());
      });
      if (match) {
        return {
          ...match,
          isStarred: starredSlugs.has(match.slug) || (match.isStarred === true)
        };
      }
    }
  } catch (e) {
    console.error('Supabase fetch error for competition', slug, e);
  }

  const fallback = competitionsData.find((c) => {
    const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
    const cSlugified = cDecoded.replace(/\\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    return cDecoded === decoded || cSlugified === slugified || (c.slug && c.slug.trim() === slug.trim());
  });
  if (!fallback) return null;
  return {
    ...fallback,
    isStarred: starredSlugs.has(fallback.slug) || (fallback.isStarred === true)
  };
}
`;
}

export async function GET() {
  const competitions = await getCompetitionsData();
  return NextResponse.json({ success: true, data: competitions });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    let updatedList: Competition[] = [];
    let sbNotice = null;

    if (Array.isArray(payload)) {
      updatedList = payload.map(c => ({ ...c, slug: (c.slug || '').trim() }));
      try {
        for (const item of updatedList) {
          const { isStarred: _unused, ...itemForSupabase } = item;
          const { error } = await supabase
            .from('competition')
            .upsert(itemForSupabase, { onConflict: 'slug' });
          if (error) {
            console.error('Supabase upsert error:', error.message);
            sbNotice = error.message;
          }
        }
      } catch (sbErr: any) {
        console.error('Supabase sync error on array save:', sbErr);
        sbNotice = sbErr?.message;
      }
    } else if (payload && typeof payload === 'object' && payload.slug) {
      const single = { ...payload, slug: (payload.slug || '').trim() } as Competition;
      const { isStarred: singleStarred, ...itemForSupabase } = single;
      
      try {
        const { error } = await supabase
          .from('competition')
          .upsert(itemForSupabase, { onConflict: 'slug' });
        if (error) {
          console.error('Supabase single upsert error:', error.message);
          sbNotice = error.message;
        }
      } catch (sbErr: any) {
        console.error('Supabase sync error on single save:', sbErr);
        sbNotice = sbErr?.message;
      }

      // Update settings.starredCompetitionSlugs if isStarred was provided
      if (typeof singleStarred === 'boolean') {
        try {
          const settingsFilePath = path.join(process.cwd(), 'src/data/settings.json');
          if (fs.existsSync(settingsFilePath)) {
            const fileData = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
            let starredList: string[] = Array.isArray(fileData.starredCompetitionSlugs) 
              ? fileData.starredCompetitionSlugs 
              : [];
            if (singleStarred) {
              starredList = Array.from(new Set([...starredList, single.slug]));
            } else {
              starredList = starredList.filter(s => s !== single.slug);
            }
            fileData.starredCompetitionSlugs = starredList;
            fileData.updatedAt = new Date().toISOString();
            fs.writeFileSync(settingsFilePath, JSON.stringify(fileData, null, 2), 'utf-8');
          }
        } catch (setErr) {
          console.error('Error updating settings.starredCompetitionSlugs:', setErr);
        }
      }

      // Merge into local list
      const existing = competitionsData.findIndex(c => 
        (c.slug || '').trim().toLowerCase() === single.slug.toLowerCase()
      );
      if (existing >= 0) {
        competitionsData[existing] = single;
        updatedList = [...competitionsData];
      } else {
        updatedList = [single, ...competitionsData];
      }
    }

    // Persist to local file
    const filePath = path.join(process.cwd(), 'src/data/competitions.ts');
    fs.writeFileSync(filePath, generateCompetitionsFileContent(updatedList), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      data: updatedList,
      supabaseNotice: sbNotice 
    });
  } catch (error: any) {
    console.error('Failed to save competitions:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlug = searchParams.get('slug');
    if (!rawSlug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }
    const slug = rawSlug.trim();
    let sbNotice = null;

    try {
      const { error } = await supabase.from('competition').delete().eq('slug', slug);
      if (error) {
        console.error('Supabase delete error:', error.message);
        sbNotice = error.message;
      }
    } catch (e: any) {
      console.error('Supabase delete error:', e);
      sbNotice = e?.message;
    }

    const filtered = competitionsData.filter(c => (c.slug || '').trim().toLowerCase() !== slug.toLowerCase());
    const filePath = path.join(process.cwd(), 'src/data/competitions.ts');
    fs.writeFileSync(filePath, generateCompetitionsFileContent(filtered), 'utf-8');

    return NextResponse.json({ success: true, supabaseNotice: sbNotice });
  } catch (error: any) {
    console.error('Failed to delete competition:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
