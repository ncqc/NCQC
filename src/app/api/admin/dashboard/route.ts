import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { achievementsData as localAchievements } from '@/data/achievements';
import { competitionsData as localCompetitions } from '@/data/competitions';
import { projectsData as localProjects } from '@/data/projects';
import fs from 'fs';
import path from 'path';


export async function GET() {
  try {
    let supabaseOnline = false;
    let achievements = localAchievements;
    let competitions = localCompetitions;
    let projects = localProjects;
    let albums: any[] = [];
    let storageFiles: any[] = [];
    let totalStorageBytes = 0;

    // 1. Fetch Achievements from Supabase
    try {
      const { data, error } = await supabase.from('achievement').select('*').order('year', { ascending: false });
      if (!error && data) {
        achievements = data;
        supabaseOnline = true;
      }
    } catch (e) {
      console.warn('Dashboard achievements fetch fallback');
    }

    // 2. Fetch Competitions from Supabase
    try {
      const { data, error } = await supabase.from('competition').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        competitions = data;
        supabaseOnline = true;
      }
    } catch (e) {
      console.warn('Dashboard competitions fetch fallback');
    }

    // 3. Fetch Projects from Supabase
    try {
      const { data, error } = await supabase.from('project').select('*').order('title', { ascending: true });
      if (!error && data) {
        projects = data;
        supabaseOnline = true;
      }
    } catch (e) {
      console.warn('Dashboard projects fetch fallback');
    }

    // 4. Fetch Gallery Albums
    try {
      const { data, error } = await supabase.from('gallery_album').select('*').order('date', { ascending: false });
      if (!error && data) {
        albums = data;
      }
    } catch (e) {
      console.warn('Dashboard albums fetch fallback');
    }

    // 5. Fetch Storage usage from Supabase images bucket
    try {
      const { data, error } = await supabase.storage.from('images').list();
      if (!error && data) {
        storageFiles = data;
        totalStorageBytes = data.reduce((acc: number, f: any) => acc + (f.metadata?.size || 0), 0);
      }
    } catch (e) {
      console.warn('Dashboard storage list fallback');
    }

    // 6. Read Maintenance Mode Settings
    let settings = { maintenanceMode: false, maintenanceNotice: '', estimatedEndTime: 'Stay Tuned' };
    try {
      const settingsPath = path.join(process.cwd(), 'src/data/settings.json');
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      }
    } catch (e) {}

    // Process Competitions with deadline calculations
    const processedCompetitions = competitions.map(comp => {
      let isExpired = false;
      let timeRemainingText = 'No deadline';
      const deadlineStr = comp.deadline || comp.date;

      if (deadlineStr) {
        try {
          const cleaned = deadlineStr.replace(/\bat\b/gi, ' ').trim();
          const target = new Date(cleaned).getTime();
          if (!isNaN(target)) {
            const diff = target - Date.now();
            if (diff <= 0) {
              isExpired = true;
              timeRemainingText = 'Submissions Closed';
            } else {
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              timeRemainingText = `${days}d ${hours}h left`;
            }
          }
        } catch {}
      }

      return {
        slug: comp.slug,
        title: comp.title,
        eventDate: comp.eventDate || comp.date,
        deadline: comp.deadline,
        image: comp.image,
        isExpired,
        timeRemainingText
      };
    });

    // Calculate total gallery photos across albums
    const totalAlbumPhotos = albums.reduce((acc, alb) => acc + (Array.isArray(alb.photos) ? alb.photos.length : 0), 0);

    // Recent Activities compiled from items
    const recentActivities: any[] = [];
    if (competitions.length > 0) {
      recentActivities.push({
        type: 'competition',
        title: competitions[0].title,
        badge: 'Competition',
        action: 'Active Competition',
        color: '#dc2626',
        icon: '⚔️',
        link: `/admin/competitions/${encodeURIComponent(competitions[0].slug.trim())}`
      });
    }
    if (achievements.length > 0) {
      recentActivities.push({
        type: 'achievement',
        title: achievements[0].title,
        badge: 'Achievement',
        action: `Year ${achievements[0].year} Award`,
        color: '#2563eb',
        icon: '🏆',
        link: `/admin/achievements/${achievements[0].slug}`
      });
    }
    if (projects.length > 0) {
      recentActivities.push({
        type: 'project',
        title: projects[0].title,
        badge: 'Project',
        action: `${projects[0].type} • ${projects[0].frequency}`,
        color: '#059669',
        icon: '🚀',
        link: `/admin/projects/${projects[0].slug}`
      });
    }
    if (albums.length > 0) {
      recentActivities.push({
        type: 'gallery',
        title: albums[0].title,
        badge: 'Gallery Album',
        action: `${albums[0].photos?.length || 0} Photos`,
        color: '#7c3aed',
        icon: '📸',
        link: `/admin/gallery/${albums[0].slug}`
      });
    }

    const storageMb = totalStorageBytes / (1024 * 1024);
    const maxStorageMb = 1024; // 1GB Free tier
    const storagePercentage = Math.min(100, (storageMb / maxStorageMb) * 100);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalAchievements: achievements.length,
          totalCompetitions: competitions.length,
          totalProjects: projects.length,
          totalGalleryImages: storageFiles.length > 0 ? storageFiles.length : (totalAlbumPhotos || 24),
        },
        supabase: {
          online: supabaseOnline,
          statusText: supabaseOnline ? 'Connected & Operational' : 'Local Fallback Active',
        },
        storage: {
          fileCount: storageFiles.length,
          usedMb: storageMb.toFixed(2),
          maxMb: maxStorageMb,
          percentage: storagePercentage.toFixed(2),
        },
        maintenance: settings,
        competitions: processedCompetitions,
        recentActivities
      }
    });
  } catch (error: any) {
    console.error('Error generating dashboard data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
