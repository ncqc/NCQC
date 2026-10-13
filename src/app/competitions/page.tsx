import Link from 'next/link';
import { getCompetitionsData } from '@/data/competitions';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export default async function CompetitionsPage() {
  const competitions = await getCompetitionsData();

  return (
    <section className="about-hero" style={{ paddingTop: '15rem', paddingBottom: '5rem' }}>
      <div className="container">
        <div className="reveal-text">
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-brutalist)' }}>Competitions</h1>
        </div>
        <div className="about-content reveal-fade delay-1 is-visible">
          <p className="lead-text" style={{ color: '#475569', fontSize: '1.25rem', lineHeight: '1.6', textAlign: 'center', margin: '0 auto 4rem auto', maxWidth: '800px' }}>
            Explore our upcoming and past intellectual battles.
          </p>
          
          <div className="competitions-grid">
            {competitions.map((competition) => (
              <div key={competition.slug} className="comp-card reveal-fade up is-visible">
                <div className="comp-img-wrapper">
                  <img src={competition.image} alt={stripStyledText(competition.title)} className="comp-img" />
                </div>
                <div className="comp-info" style={{ padding: '2rem 1.5rem 2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <h3 className="comp-title" style={{ fontSize: '1.25rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <RenderStyledText text={competition.title} />
                  </h3>
                  <div className="comp-date-wrapper" style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d90429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {competition.date}
                  </div>
                  <Link href={`/competitions/${encodeURIComponent((competition.slug || '').trim())}`} className="comp-btn-modern" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                    View Details &rarr;
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
