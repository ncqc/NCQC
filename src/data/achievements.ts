import { supabase } from '@/lib/supabase';
import { maskImageUrl } from '@/utils/media';

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
    
  if (error || !data) {
    if (error) console.error('Error fetching achievements:', error);
    return achievementsData.map(a => ({ ...a, image: maskImageUrl(a.image) }));
  }
  
  return (data as Achievement[]).map(a => ({
    ...a,
    image: maskImageUrl(a.image)
  }));
}

export async function getAchievement(slug: string): Promise<Achievement | null> {
  const { data, error } = await supabase
    .from('achievement')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error || !data) {
    if (error) console.error('Error fetching achievement:', error);
    const local = achievementsData.find(a => a.slug === slug);
    return local ? { ...local, image: maskImageUrl(local.image) } : null;
  }
  
  return {
    ...(data as Achievement),
    image: maskImageUrl(data.image)
  };
}
