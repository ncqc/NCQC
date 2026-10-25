import { notFound } from 'next/navigation';
import { getCompetition, getCompetitionsData } from '@/data/competitions';
import Link from 'next/link';
import CompetitionTimer from '@/components/CompetitionTimer';
import { formatPublicHtml } from '@/utils/sanitizeHtml';
import 'react-quill-new/dist/quill.snow.css';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export const revalidate = 60;

export async function generateStaticParams() {
  const data = await getCompetitionsData();
  return data.map((comp) => ({
    slug: comp.slug,
  }));
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const competition = await getCompetition(resolvedParams.slug);

  if (!competition) {
    notFound();
  }

  return (
    <div className="container comp-page-container">
        
        {/* Back Link */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/competitions" className="btn-back-link">
            &larr; Back to Competitions
          </Link>
        </div>

        {/* Top Header / Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 
            style={{ 
              fontSize: 'clamp(1.75rem, 5.5vw, 3.4rem)', 
              fontWeight: 900, 
              color: '#0f172a', 
              fontFamily: 'var(--font-primary), sans-serif',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              textWrap: 'balance',
              margin: '0 0 0.5rem 0'
            }}
          >
            <RenderStyledText text={competition.title} />
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', color: '#64748b' }}>
            Nalanda College Quiz Club &bull; Official Competition Portal
          </p>
        </div>

        {/* 2-Column Hero Grid (Like Image 4: Left Poster, Right 3D Card) */}
        <div className="comp-hero-grid">
            
            {/* Left Column: Poster Image */}
            <div 
              className="comp-main reveal-fade up is-visible"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start'
              }}
            >
              <div 
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e2e8f0',
                  background: '#090d16'
                }}
              >
                <img 
                  src={competition.image} 
                  alt={stripStyledText(competition.title)} 
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '620px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }} 
                />
              </div>
            </div>

            {/* Right Column: 3D Competition Details Card */}
            <div className="comp-sidebar reveal-fade up delay-1 is-visible" style={{ width: '100%', marginTop: 0, paddingTop: 0 }}>
              <CompetitionTimer 
                title={stripStyledText(competition.title)}
                eventDate={competition.eventDate || competition.date}
                startDate={competition.startDate || competition.eventDate || competition.date}
                dateStr={competition.deadline || competition.date}
                statusType={competition.statusType}
                rulesButtonText={competition.rulesButtonText}
                rulesLink={competition.rulesButtonLink || '#'}
                submissionsButtonText={competition.submissionsButtonText}
                registerLink={competition.submissionsButtonLink || '#'}
                competitionSlug={competition.slug}
              />
            </div>
        </div>

        {/* Bottom Section: Guidelines & Rich Text Content inside 3D Card */}
        <div 
          className="comp-bottom-details comp-details-card reveal-fade up delay-2 is-visible" 
          style={{ 
            marginTop: '2.5rem'
          }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <span style={{ 
                background: 'rgba(217, 4, 41, 0.08)', 
                color: '#d90429', 
                fontWeight: 700, 
                fontSize: '0.78rem', 
                padding: '0.35rem 0.85rem', 
                borderRadius: '100px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d90429' }} />
                Official Guidelines
              </span>
            </div>

            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', 
              fontWeight: 800, 
              color: '#0f172a', 
              fontFamily: 'var(--font-primary)', 
              marginBottom: '0.35rem',
              letterSpacing: '-0.02em',
              textWrap: 'balance'
            }}>
              Guidelines & Rules
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', fontStyle: 'italic', marginBottom: '1.75rem' }}>
              Please review all participation requirements and terms prior to submission.
            </p>

            <div style={{ height: '1px', background: 'linear-gradient(90deg, #e2e8f0 0%, #f8fafc 100%)', marginBottom: '2rem' }} />

            {/* Quill Content Area with sanitization */}
            <div className="detail-section" style={{ marginBottom: 0 }}>
                {competition.contentHtml ? (
                  <div 
                    className="quill-content ql-editor"
                    dangerouslySetInnerHTML={{ __html: formatPublicHtml(competition.contentHtml) }} 
                  />
                ) : (
                  <div style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.8 }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>1. Overview & Eligibility</h3>
                      <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', listStyleType: 'disc' }}>
                          {competition.fullDesc.map((paragraph, index) => (
                              <li key={index} style={{ marginBottom: '0.8rem' }}>{paragraph}</li>
                          ))}
                      </ul>
                  </div>
                )}
            </div>

            {/* Custom Buttons (if any) */}
            {competition.customButtons && competition.customButtons.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '3rem' }}>
                    {competition.customButtons.map((btn, idx) => (
                        <a 
                            key={idx} 
                            href={btn.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-3d-primary"
                            style={{ 
                                background: btn.color || undefined, 
                                width: 'auto',
                                padding: '0.85rem 2rem'
                            }}
                        >
                            {btn.text} →
                        </a>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
