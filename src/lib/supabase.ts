import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iwjnbreeazxvbzxelnzj.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_SMYJrdhxWSvxBnDkGGtHFA_yZbrb_Sn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
