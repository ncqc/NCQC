import Link from 'next/link';
import { getAchievementsData } from '@/data/achievements';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export const revalidate = 60;

export default async function AchievementsPage() {
  const achievementsData = await getAchievementsData();
  
  return (
    <section className="about-hero" style={{ paddingTop: '15rem', paddingBottom: '5rem' }}>
      <div className="container">
        <div className="reveal-text">
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-brutalist)' }}>Our Achievements</h1>
        </div>
        <div className="about-content reveal-fade delay-1 is-visible">
          <p className="lead-text" style={{ color: '#475569', fontSize: '1.25rem', lineHeight: '1.6', textAlign: 'center', margin: '0 auto 4rem auto', maxWidth: '800px' }}>
            A legacy of excellence forged through knowledge, strategy, and unyielding determination.
          </p>
          
          <h2 className="section-subtitle">Championships & Victories</h2>
          
          <div className="competitions-grid">
            {achievementsData.map((achievement) => (
              <div key={achievement.slug} className="comp-card reveal-fade up is-visible">
                <div className="comp-img-wrapper">
                  <img src={achievement.image} alt={stripStyledText(achievement.title)} className="comp-img" style={{ objectFit: achievement.image.includes('logo') ? 'contain' : 'cover', padding: achievement.image.includes('logo') ? '2rem' : '0' }} />
                </div>
                <div className="comp-info">
                  <h3 className="comp-title" style={{ fontSize: '1.25rem' }}><RenderStyledText text={achievement.title} /> (<RenderStyledText text={achievement.year} />)</h3>
                  <div className="comp-date-wrapper" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#64748b', padding: '0 1rem', flex: 1 }}>
                    <RenderStyledText text={achievement.shortDesc} />
                  </div>
                  <div className="comp-divider"></div>
                  <Link href={`/achievements/${achievement.slug}`} prefetch={true} className="comp-btn-modern">
                    Read More &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
