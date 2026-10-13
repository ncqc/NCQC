import { supabase } from '@/lib/supabase';

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
    
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  
  return data as Project[];
}

export async function getProject(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('project')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  
  return data as Project;
}
