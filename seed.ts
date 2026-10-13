import { createClient } from '@supabase/supabase-js';
import { achievementsData } from './src/data/achievements';

const supabase = createClient(
  'https://iwjnbreeazxvbzxelnzj.supabase.co',
  'sb_publishable_SMYJrdhxWSvxBnDkGGtHFA_yZbrb_Sn'
);

async function seed() {
  console.log('Seeding achievements to Supabase...');
  for (const achievement of achievementsData) {
    console.log(`Inserting ${achievement.slug}...`);
    const { id, sidebarWidget, ...dataToInsert } = achievement as any;
    
    const { data, error } = await supabase
      .from('achievement')
      .insert({ ...dataToInsert, slug: achievement.slug });
      
    if (error) {
      console.error('Error inserting', achievement.slug, error);
    } else {
      console.log('Successfully inserted', achievement.slug);
    }
  }
  console.log('Done seeding.');
}

seed();
