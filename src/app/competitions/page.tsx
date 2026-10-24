import { getCompetitionsData } from '@/data/competitions';
import CompetitionsClientView from '@/components/CompetitionsClientView';

export const revalidate = 60;

export default async function CompetitionsPage() {
  const competitions = await getCompetitionsData();

  return (
    <section className="about-hero" style={{ paddingTop: '9.5rem', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>
        <div className="reveal-text">
          <h1 className="page-title" style={{
            textAlign: 'center',
            color: '#111',
            WebkitTextStroke: '0',
            fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif',
            marginBottom: '0.75rem',
            fontSize: 'clamp(2.8rem, 6vw, 4.4rem)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.15
          }}>
            Competitions
          </h1>
        </div>
        <div className="about-content reveal-fade delay-1 is-visible">
          <p style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '1rem',
            maxWidth: '650px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.55
          }}>
            Explore our upcoming battles, ongoing championships, and past tournament archives.
          </p>

          <CompetitionsClientView initialCompetitions={competitions} />
        </div>
      </div>
    </section>
  );
}
