import { MetadataRoute } from 'next';
import { getCompetitionsData } from '@/data/competitions';
import { getAchievementsData } from '@/data/achievements';
import { getProjectsData } from '@/data/projects';
import { getGalleryAlbums } from '@/data/gallery';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ncqc27.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Static core pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/team`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/competitions`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/achievements`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ];

  // Dynamic routes
  try {
    const [competitions, achievements, projects, albums] = await Promise.all([
      getCompetitionsData().catch(() => []),
      getAchievementsData().catch(() => []),
      getProjectsData().catch(() => []),
      getGalleryAlbums().catch(() => []),
    ]);

    const competitionRoutes: MetadataRoute.Sitemap = competitions.map((c) => ({
      url: `${siteUrl}/competitions/${encodeURIComponent(c.slug.trim())}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    const achievementRoutes: MetadataRoute.Sitemap = achievements.map((a) => ({
      url: `${siteUrl}/achievements/${encodeURIComponent(a.slug.trim())}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    }));

    const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
      url: `${siteUrl}/projects/${encodeURIComponent(p.slug.trim())}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    const galleryRoutes: MetadataRoute.Sitemap = albums.map((alb) => ({
      url: `${siteUrl}/gallery/${encodeURIComponent(alb.slug.trim())}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.75,
    }));

    return [
      ...staticRoutes,
      ...competitionRoutes,
      ...achievementRoutes,
      ...projectRoutes,
      ...galleryRoutes,
    ];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
