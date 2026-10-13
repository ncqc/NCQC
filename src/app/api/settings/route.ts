import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { getSiteSettingsAsync, getSiteSettings } from '@/data/settings';

const settingsFilePath = path.join(process.cwd(), 'src/data/settings.json');

function getLocalSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const content = fs.readFileSync(settingsFilePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading settings file:', err);
  }
  return getSiteSettings();
}

export async function GET() {
  try {
    const settings = await getSiteSettingsAsync();
    return NextResponse.json({ success: true, settings });
  } catch (e: any) {
    const settings = getLocalSettings();
    return NextResponse.json({ success: true, settings });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let current: any = null;
    try {
      current = await getSiteSettingsAsync();
    } catch {
      current = getLocalSettings();
    }

    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString()
    };

    // 1. Persist to Supabase so it works on cloud hosting (Vercel / Netlify serverless)
    try {
      const { error: sbErr } = await supabase.from('competition').upsert({
        slug: '__site_settings__',
        title: 'Site Settings',
        contentHtml: JSON.stringify(updated),
        date: '2026',
        shortDesc: 'System Configuration Record',
        image: '/logo.png'
      }, { onConflict: 'slug' });
      if (sbErr) console.warn('Supabase settings upsert notice:', sbErr.message);
    } catch (sbErr) {
      console.warn('Supabase settings network error:', sbErr);
    }

    // 2. Also try saving to local file (for localhost persistence)
    try {
      fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (fsErr) {
      // Ignored on read-only serverless hosts
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Error saving settings:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
