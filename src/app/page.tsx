import Link from 'next/link';
import Typewriter from '@/components/Typewriter';
import { getAchievementsData } from '@/data/achievements';
import { getProjectsData } from '@/data/projects';
import { getGalleryHeroImages } from '@/data/gallery';
import { getCompetitionsData } from '@/data/competitions';
import { getSiteSettingsAsync } from '@/data/settings';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export const revalidate = 60;

export default async function Home() {
  const achievements = await getAchievementsData();
  const projects = await getProjectsData();
  const heroImages = await getGalleryHeroImages();
  const competitions = await getCompetitionsData();
  const settings = await getSiteSettingsAsync();
  
  // Get featured achievements, fallback to newest 3 if none are featured yet
  const featuredAchievements = achievements.filter(a => a.isFeatured).slice(0, 3);
  const displayAchievements = featuredAchievements.length > 0 ? featuredAchievements : achievements.slice(0, 3);

  // Get starred projects, fallback to newest 3
  const starredProjects = projects.filter(p => p.isStarred).slice(0, 3);
  const displayProjects = starredProjects.length > 0 ? starredProjects : projects.slice(0, 3);

  // Get starred competitions for Home Page (maximum 3)
  const starredList = competitions.filter(c => c.isStarred).slice(0, 3);
  const starredCompetitions = starredList.length > 0 ? starredList : competitions.slice(0, 3);
  const showUpcomingBattles = settings.showUpcomingBattles && starredCompetitions.length > 0;

  return (
    <>
      {/* Ultra-Clean Hero Section */}
      <section className="hero">
        <div className="hero-container">
            <div className="hero-main-centered">
                <div className="hero-visual reveal-fade is-visible">
                    <img src="/bar.png" alt="Quiz Society Home Logo" className="home-logo-centered" />
                </div>
                <div className="hero-content-centered reveal-fade delay-1 is-visible">
                    <h1 className="hero-title-main" style={{ fontFamily: 'var(--font-the-globe), "TheGlobe", sans-serif' }}>
                        <span className="title-dark" style={{ fontFamily: 'var(--font-the-globe), "TheGlobe", sans-serif' }}>Nalanda College</span>
                        <br />
                        <span className="title-red" style={{ fontFamily: 'var(--font-the-globe), "TheGlobe", sans-serif' }}>Quiz Club</span>
                    </h1>
                    <div className="hero-motto-wrap-centered">
                        <p className="hero-motto-text" style={{ fontFamily: 'var(--font-bighorn), "BighornItalic", sans-serif' }}>
                            <Typewriter text="Knowledge Through out The World." speed={70} />
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Key Statistics */}
      <section className="section-stats" id="explore">
          <div className="container">
              <div className="stats-3d-grid">
                  <div className="stat-3d-card reveal-fade up is-visible">
                      <div className="stat-content">
                          <h2 className="counter-wrap"><span className="counter">43</span></h2>
                          <p>Years of Legacy</p>
                      </div>
                  </div>
                  <div className="stat-3d-card reveal-fade up delay-1 is-visible">
                      <div className="stat-content">
                          <h2 className="counter-wrap"><span className="counter">90</span>+</h2>
                          <p>Active Members</p>
                      </div>
                  </div>
                  <div className="stat-3d-card reveal-fade up delay-2 is-visible">
                      <div className="stat-content">
                          <h2 className="counter-wrap"><span className="counter">50</span>+</h2>
                          <p>Competitions Won</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Minimalist Features */}
      <section id="explore" className="section-clean">
          <div className="container">
              <div className="section-header reveal-fade is-visible">
                  <h2 className="section-title">The Standard of Excellence</h2>
              </div>
              
              <div className="grid-clean">
                  <div className="card-clean reveal-fade up is-visible">
                      <div className="card-line"></div>
                      <div className="card-number">01</div>
                      <h3>Intellectual Mastery</h3>
                      <p>Going beyond textbooks. We train the sharpest minds to conquer challenges, provoke thought, and continuously expand their intellectual horizons.</p>
                  </div>
                  
                  <div className="card-clean reveal-fade up delay-1 is-visible">
                      <div className="card-line"></div>
                      <div className="card-number">02</div>
                      <h3>Championship Legacy</h3>
                      <p>From inter-school battles to national championships, we proudly represent our college, dominating the island&apos;s most prestigious quiz arenas.</p>
                  </div>
                  
                  <div className="card-clean reveal-fade up delay-2 is-visible">
                      <div className="card-line"></div>
                      <div className="card-number">03</div>
                      <h3>Elite Community</h3>
                      <p>More than just a club. We foster a collaborative, distraction-free environment where passionate learners share knowledge and grow together.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Upcoming Events (Neon/Glass Timeline) */}
      {showUpcomingBattles && (
        <section className="section-events">
            <div className="container">
                <div className="section-header reveal-fade text-center is-visible">
                    <h2 className="section-title">Upcoming Battles</h2>
                </div>
                
                <div className={`competitions-grid ${starredCompetitions.length === 1 ? 'single-comp' : ''}`}>
                    {starredCompetitions.map((comp, index) => (
                      <div key={comp.slug} className={`comp-card reveal-fade up ${index > 0 ? `delay-${index}` : ''} is-visible`}>
                          <div className="comp-img-wrapper">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={comp.image || '/comp1.jpg'} 
                                alt={stripStyledText(comp.title)} 
                                className="comp-img" 
                                style={{ objectFit: 'cover' }}
                              />
                          </div>
                          <div className="comp-info">
                              <h3 className="comp-title" style={{ fontSize: '1.25rem' }}>
                                <RenderStyledText text={comp.title} />
                              </h3>
                              <div className="comp-date-wrapper">
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                  {comp.eventDate || comp.date}
                              </div>
                              {comp.shortDesc && (
                                <div className="comp-date-wrapper" style={{ fontSize: '0.85rem', color: '#64748b', padding: '0 1rem', margin: '0.35rem 0', lineHeight: '1.4' }}>
                                  <RenderStyledText text={comp.shortDesc} />
                                </div>
                              )}
                              <div className="comp-divider"></div>
                              <div style={{ padding: '0 1rem', width: '100%' }}>
                                <Link href={`/competitions/${encodeURIComponent(comp.slug.trim())}`} prefetch={true} className="comp-btn-modern" style={{ textAlign: 'center', display: 'block' }}>
                                  View Details &rarr;
                                </Link>
                              </div>
                          </div>
                      </div>
                    ))}
                </div>

                <div className="text-center mt-4">
                    <Link href="/competitions" prefetch={true} className="btn-outline-red">Explore All Competitions</Link>
                </div>
            </div>
        </section>
      )}

      {/* Featured Achievements */}
      <section className="section-achievements-preview">
          <div className="container">
              <div className="section-header reveal-fade text-center is-visible">
                  <h2 className="section-title">Hall of Fame</h2>
              </div>
              <div className={`competitions-grid ${displayAchievements.length === 1 ? 'single-comp' : ''}`}>
                  {displayAchievements.map((achievement, index) => (
                    <div key={achievement.slug} className={`comp-card reveal-fade up ${index > 0 ? `delay-${index}` : ''} is-visible`}>
                        <div className="comp-img-wrapper">
                            <img src={achievement.image} alt={stripStyledText(achievement.title)} className="comp-img" style={{ objectFit: achievement.image.includes('logo') ? 'contain' : 'cover', padding: achievement.image.includes('logo') ? '2rem' : '0' }} />
                        </div>
                        <div className="comp-info">
                            <h3 className="comp-title" style={{ fontSize: '1.25rem' }}><RenderStyledText text={achievement.title} /> (<RenderStyledText text={achievement.year} />)</h3>
                            <div className="comp-date-wrapper" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#64748b', padding: '0 1rem', flex: 1 }}>
                                <RenderStyledText text={achievement.shortDesc} />
                            </div>
                            <div className="comp-divider"></div>
                            <Link href={`/achievements/${achievement.slug}`} prefetch={true} className="comp-btn-modern">Read More &rarr;</Link>
                        </div>
                    </div>
                  ))}
              </div>
              <div className="text-center" style={{ marginTop: '3rem' }}>
                  <Link href="/achievements" prefetch={true} className="btn-outline-red">See All Victories</Link>
              </div>
          </div>
      </section>

      {/* Featured Projects */}
      <section className="section-achievements-preview">
          <div className="container">
              <div className="section-header reveal-fade text-center is-visible" style={{ marginBottom: '4rem' }}>
                  <h2 className="section-title">Our Projects</h2>
                  <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '1rem' }}>Discover the initiatives driven by our society.</p>
              </div>
              <div className={`competitions-grid ${displayProjects.length === 1 ? 'single-comp' : ''}`}>
                  {displayProjects.map((project, index) => (
                    <div key={project.slug} className={`comp-card reveal-fade up ${index > 0 ? `delay-${index}` : ''} is-visible`}>
                        <div className="comp-img-wrapper">
                            <img src={project.image} alt={stripStyledText(project.title)} className="comp-img" style={{ objectFit: project.image.includes('logo') ? 'contain' : 'cover', padding: project.image.includes('logo') ? '2rem' : '0' }} />
                        </div>
                        <div className="comp-info">
                            <h3 className="comp-title" style={{ fontSize: '1.25rem' }}><RenderStyledText text={project.title} /></h3>
                            <div className="comp-date-wrapper" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#64748b', padding: '0 1rem', flex: 1 }}>
                                <RenderStyledText text={project.shortDesc} />
                            </div>
                            <div className="comp-divider"></div>
                            <Link href={`/projects/${project.slug}`} prefetch={true} className="comp-btn-modern">Read More &rarr;</Link>
                        </div>
                    </div>
                  ))}
              </div>
              <div className="text-center" style={{ marginTop: '3rem' }}>
                  <Link href="/projects" prefetch={true} className="btn-outline-red">Explore All Projects</Link>
              </div>
          </div>
      </section>

      {/* Gallery Sneak Peek (3D Carousel Mini) */}
      <section className="section-gallery-preview" style={{ paddingBottom: '10rem' }}>
          <div className="container text-center">
              <div className="section-header reveal-fade is-visible">
                  <h2 className="section-title">Moments of Glory</h2>
              </div>
              
              <div className="gallery-wrapper reveal-fade up is-visible" style={{ transform: 'scale(0.7)', margin: '-2rem 0' }}>
                  <img src="/bar.png" alt="NCQC Center Logo" className="gallery-center-logo" />
                  <div className="gallery-3d-container">
                      <div className="gallery-spinner">
                          {heroImages.slice(0, 6).map((img, index) => (
                            <div key={index} className="gallery-item" style={{ '--i': index + 1 } as React.CSSProperties}>
                              <img src={img} alt={`Gallery ${index}`} />
                            </div>
                          ))}
                      </div>
                  </div>
              </div>
              
              <Link href="/gallery" prefetch={true} className="btn-outline-red" style={{ marginTop: '1rem', position: 'relative', zIndex: 20 }}>Enter 3D Gallery</Link>
          </div>
      </section>


    </>
  );
}
