import { supabase } from '@/lib/supabase';
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

export const defaultTeamMembers: TeamMember[] = [
  {
    "id": "teacher-1",
    "name": "Mrs. Lakmali Kahingala",
    "role": "Teacher-In-Charge",
    "category": "teacher",
    "image": "",
    "orderIndex": 1
  },
  {
    "id": "teacher-2",
    "name": "Mrs. Madhuwanthi Nirudhika",
    "role": "Teacher-In-Charge",
    "category": "teacher",
    "image": "",
    "orderIndex": 2
  },
  {
    "id": "teacher-3",
    "name": "Mrs. Dilshika Priyankara",
    "role": "Teacher-In-Charge",
    "category": "teacher",
    "image": "",
    "orderIndex": 3
  },
  {
    "id": "exec-1",
    "name": "Kemitha Randinu",
    "role": "President",
    "category": "executive",
    "image": "",
    "orderIndex": 4
  },
  {
    "id": "exec-2",
    "name": "Sadeesh Mamuhewa",
    "role": "Secretary",
    "category": "executive",
    "image": "",
    "orderIndex": 5
  },
  {
    "id": "exec-3",
    "name": "Vidusha Perera",
    "role": "Treasurer",
    "category": "executive",
    "image": "",
    "orderIndex": 6
  },
  {
    "id": "exec-4",
    "name": "Ahas Ranasinghe",
    "role": "Vice President",
    "category": "executive",
    "image": "",
    "orderIndex": 7
  },
  {
    "id": "exec-5",
    "name": "Deenal Wathsilu",
    "role": "Chief Organizer",
    "category": "executive",
    "image": "",
    "orderIndex": 8
  },
  {
    "id": "exec-6",
    "name": "Senuda Hansira",
    "role": "Assistant Secretary",
    "category": "executive",
    "image": "",
    "orderIndex": 9
  },
  {
    "id": "exec-7",
    "name": "Bisandu Dulmira",
    "role": "Media Coordinator",
    "category": "executive",
    "image": "",
    "orderIndex": 10
  }
];

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
