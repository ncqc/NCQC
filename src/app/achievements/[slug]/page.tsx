import { notFound } from 'next/navigation';
import { getAchievementsData, getAchievement } from '@/data/achievements';
import Link from 'next/link';
import 'react-quill-new/dist/quill.snow.css';
import { formatPublicHtml } from '@/utils/sanitizeHtml';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export const revalidate = 60;

export async function generateStaticParams() {
  const achievements = await getAchievementsData();
  return achievements.map((achievement) => ({
    slug: achievement.slug,
  }));
}

export default async function AchievementPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const achievement = await getAchievement(resolvedParams.slug);

  if (!achievement) {
    notFound();
  }

  return (
    <div className="container comp-details-single-container">
        <div className="comp-main reveal-fade up is-visible" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '2rem' }}>
              <Link href="/achievements" className="btn-back-link">
                &larr; Back to Achievements
              </Link>
            </div>

            {/* Category Tag & Year */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(217, 4, 41, 0.08)', color: '#d90429', fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 1rem', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <RenderStyledText text={achievement.type} />
              </span>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>
                &bull; <RenderStyledText text={achievement.year} />
              </span>
            </div>

            {/* Main Page Title */}
            <h1 className="comp-page-title" style={{ marginBottom: '1rem', maxWidth: '700px', lineHeight: 1.2 }}>
              <RenderStyledText text={achievement.title} />
            </h1>

            <p className="comp-org" style={{ marginBottom: '3rem', fontSize: '1.2rem', color: '#64748b' }}>
              A Historic Milestone for Nalanda College Quiz Club
            </p>

            {/* Main Poster / Hero Image - Sized prominently like Image 2 */}
            {achievement.image && (
              <div style={{ 
                width: '100%', 
                maxWidth: '700px', 
                marginBottom: '3.5rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <img 
                  src={achievement.image} 
                  alt={stripStyledText(achievement.title)} 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '600px',
                    borderRadius: '24px', 
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12)', 
                    objectFit: 'contain',
                    background: achievement.image.includes('logo') ? '#fff' : 'transparent',
                    border: achievement.image.includes('logo') ? '1px solid #e2e8f0' : 'none',
                    padding: achievement.image.includes('logo') ? '2.5rem' : '0',
                    display: 'block' 
                  }} 
                />
              </div>
            )}

            <div className="flowing-details" style={{ textAlign: 'left', width: '100%' }}>
                <div className="detail-section">
                    {achievement.contentHtml ? (
                      <div 
                        className="quill-content ql-editor"
                        dangerouslySetInnerHTML={{ __html: formatPublicHtml(achievement.contentHtml) }} 
                      />
                    ) : (
                      <div style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.8 }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>The Journey to Victory</h3>
                        <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
                            {achievement.fullDesc.map((paragraph, index) => (
                                <li key={index} style={{ marginBottom: '1rem' }}>
                                    {paragraph}
                                </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
            </div>
            
            {/* Custom Buttons rendering area */}
            {achievement.customButtons && achievement.customButtons.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '3rem', width: '100%' }}>
                    {achievement.customButtons.map((btn, idx) => (
                        <a 
                            key={idx} 
                            href={btn.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:-translate-y-1 hover:shadow-lg transition-transform duration-300"
                            style={{ 
                                background: btn.color || '#111', 
                                color: '#fff', 
                                padding: '1rem 2rem', 
                                borderRadius: '100px', 
                                textDecoration: 'none', 
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                            }}
                        >
                            {btn.text}
                        </a>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
