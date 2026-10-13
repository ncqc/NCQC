import settingsJson from './settings.json';
import { supabase } from '@/lib/supabase';

export interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceNotice: string;
  estimatedEndTime: string;
  showUpcomingBattles: boolean;
  starredCompetitionSlugs: string[];
  updatedAt?: string;
}

export function getSiteSettings(): SiteSettings {
  const data = settingsJson as any;
  return {
    maintenanceMode: data.maintenanceMode ?? false,
    maintenanceNotice: data.maintenanceNotice || '',
    estimatedEndTime: data.estimatedEndTime || 'Stay Tuned',
    showUpcomingBattles: data.showUpcomingBattles !== false,
    starredCompetitionSlugs: Array.isArray(data.starredCompetitionSlugs)
      ? data.starredCompetitionSlugs
      : [
          "competition-1791826378798",
          "All Island Inter School General Knowledge Quiz Competition"
        ],
    updatedAt: data.updatedAt
  };
}

export async function getSiteSettingsAsync(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('competition')
      .select('contentHtml')
      .eq('slug', '__site_settings__')
      .single();

    if (!error && data?.contentHtml) {
      const parsed = JSON.parse(data.contentHtml);
      return {
        maintenanceMode: parsed.maintenanceMode ?? false,
        maintenanceNotice: parsed.maintenanceNotice || '',
        estimatedEndTime: parsed.estimatedEndTime || 'Stay Tuned',
        showUpcomingBattles: parsed.showUpcomingBattles !== false,
        starredCompetitionSlugs: Array.isArray(parsed.starredCompetitionSlugs)
          ? parsed.starredCompetitionSlugs
          : [
              "competition-1791826378798",
              "All Island Inter School General Knowledge Quiz Competition"
            ],
        updatedAt: parsed.updatedAt
      };
    }
  } catch (err) {
    console.warn('Error fetching site settings from Supabase, using local fallback:', err);
  }

  return getSiteSettings();
}
