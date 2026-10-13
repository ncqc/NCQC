import { supabase } from '@/lib/supabase';

export interface Achievement {
  slug: string;
  title: string;
  type: string;
  year: string;
  shortDesc: string;
  fullDesc: string[];
  contentHtml?: string;
  image: string;
  sidebarWidget?: {
    enabled: boolean;
    title: string;
    value: string;
    buttonText: string;
    buttonLink: string;
  };
  customButtons?: {
    text: string;
    link: string;
    color: string;
  }[];
  isFeatured?: boolean;
}

export const achievementsData: Achievement[] = [];

export async function getAchievementsData(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievement')
    .select('*')
    .order('year', { ascending: false });
    
  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
  
  return data as Achievement[];
}

export async function getAchievement(slug: string): Promise<Achievement | null> {
  const { data, error } = await supabase
    .from('achievement')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error) {
    console.error('Error fetching achievement:', error);
    return null;
  }
  
  return data as Achievement;
}
