import { supabase } from '@/lib/supabase';
import { maskImageUrl } from '@/utils/media';

export interface Project {
  slug: string;
  title: string;
  type: string;
  frequency: string;
  shortDesc: string;
  fullDesc?: string[];
  contentHtml?: string;
  image: string;
  isStarred?: boolean;
}

export const projectsData: Project[] = [];

export async function getProjectsData(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('project')
    .select('*')
    .order('title', { ascending: true });
    
  if (error || !data) {
    if (error) console.error('Error fetching projects:', error);
    return projectsData.map(p => ({ ...p, image: maskImageUrl(p.image) }));
  }
  
  return (data as Project[]).map(p => ({
    ...p,
    image: maskImageUrl(p.image)
  }));
}

export async function getProject(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('project')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error || !data) {
    if (error) console.error('Error fetching project:', error);
    const local = projectsData.find(p => p.slug === slug);
    return local ? { ...local, image: maskImageUrl(local.image) } : null;
  }
  
  return {
    ...(data as Project),
    image: maskImageUrl(data.image)
  };
}
