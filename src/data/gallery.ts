import { supabase } from '@/lib/supabase';
import { maskImageUrl } from '@/utils/media';

export interface Album {
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  photos: string[];
}

export async function getGalleryAlbums(): Promise<Album[]> {
  const { data, error } = await supabase
    .from('gallery_album')
    .select('*')
    .order('date', { ascending: false });
    
  if (error || !data) {
    if (error) console.error('Error fetching gallery albums:', error);
    return [];
  }
  return (data as Album[]).map(a => ({
    ...a,
    coverImage: maskImageUrl(a.coverImage),
    photos: (a.photos || []).map(maskImageUrl),
  }));
}

export async function getAlbum(slug: string): Promise<Album | null> {
  const { data, error } = await supabase
    .from('gallery_album')
    .select('*')
    .eq('slug', slug)
    .single();
    
  if (error || !data) {
    if (error) console.error('Error fetching album:', error);
    return null;
  }
  return {
    ...(data as Album),
    coverImage: maskImageUrl(data.coverImage),
    photos: ((data as Album).photos || []).map(maskImageUrl),
  };
}

export async function getGalleryHeroImages(): Promise<string[]> {
  const { data, error } = await supabase
    .from('gallery_hero')
    .select('*')
    .eq('id', 1)
    .single();
    
  if (error || !data || !data.images) {
    // Default images if nothing is set in DB yet
    return [
      "https://picsum.photos/400/500?random=11",
      "https://picsum.photos/400/500?random=12",
      "https://picsum.photos/400/500?random=13",
      "https://picsum.photos/400/500?random=14",
      "https://picsum.photos/400/500?random=15",
      "https://picsum.photos/400/500?random=16"
    ];
  }
  return (data.images as string[]).map(maskImageUrl);
}
