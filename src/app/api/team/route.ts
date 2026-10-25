import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { TeamMember, defaultTeamMembers, getTeamMembers } from '@/data/team';

function generateTeamFileContent(list: TeamMember[]) {
  return `import { supabase } from '@/lib/supabase';
import { maskImageUrl } from '@/utils/media';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'teacher' | 'executive';
  image?: string;
  orderIndex: number;
  created_at?: string;
}

export const defaultTeamMembers: TeamMember[] = ${JSON.stringify(list, null, 2)};

export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    let { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('order_index', { ascending: true });

    if (error && (error.code === '42P01' || error.message?.includes('not found') || error.message?.includes('does not exist'))) {
      const alt = await supabase
        .from('team_member')
        .select('*')
        .order('order_index', { ascending: true });
      if (!alt.error && Array.isArray(alt.data)) {
        data = alt.data;
        error = null;
      }
    }

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((m: any) => ({
        id: String(m.id),
        name: m.name || '',
        role: m.role || '',
        category: m.category === 'teacher' ? 'teacher' : 'executive',
        image: m.image ? maskImageUrl(m.image) : '',
        orderIndex: Number(m.order_index ?? m.orderIndex ?? 0),
        created_at: m.created_at
      }));
    }
  } catch (e) {
    console.warn('Supabase fetch for team members failed, using local default:', e);
  }

  return defaultTeamMembers.map(m => ({
    ...m,
    image: m.image ? maskImageUrl(m.image) : ''
  }));
}
`;
}

export async function GET() {
  try {
    const members = await getTeamMembers();
    return NextResponse.json({ success: true, data: members });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const members: TeamMember[] = body.members;

    if (!Array.isArray(members)) {
      return NextResponse.json({ success: false, error: 'Invalid members payload' }, { status: 400 });
    }

    // 1. Persist to local code file so site works 100% reliably immediately
    try {
      const teamFilePath = path.join(process.cwd(), 'src', 'data', 'team.ts');
      fs.writeFileSync(teamFilePath, generateTeamFileContent(members), 'utf8');
    } catch (fsErr) {
      console.warn('Local team.ts update warning:', fsErr);
    }

    // 2. Persist to Supabase database
    let supabaseSuccess = false;
    let supabaseError: string | null = null;

    try {
      // Map to db column names (order_index)
      const dbPayload = members.map((m, idx) => ({
        id: m.id || `member-${idx + 1}`,
        name: m.name,
        role: m.role,
        category: m.category,
        image: m.image || '',
        order_index: idx + 1
      }));

      // Try 'team_members' table first
      let { error } = await supabase.from('team_members').upsert(dbPayload, { onConflict: 'id' });

      // If 'team_members' table does not exist, try 'team_member'
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        const alt = await supabase.from('team_member').upsert(dbPayload, { onConflict: 'id' });
        error = alt.error;
      }

      if (error) {
        supabaseError = error.message;
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          supabaseError = 'Supabase Permission Denied: Run "GRANT ALL ON TABLE public.team_members TO anon, authenticated, service_role;" in Supabase SQL Editor.';
        }
      } else {
        supabaseSuccess = true;
      }
    } catch (dbErr: any) {
      supabaseError = dbErr.message;
    }

    return NextResponse.json({
      success: true,
      supabaseSuccess,
      supabaseError,
      message: '✅ Team members updated successfully!'
    });
  } catch (err: any) {
    console.error('Save team error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
