import Link from 'next/link';
import Typewriter from '@/components/Typewriter';
import Stats3DSection from '@/components/Stats3DSection';
import StandardOfExcellence3D from '@/components/StandardOfExcellence3D';
import { getAchievementsData } from '@/data/achievements';
import { getProjectsData } from '@/data/projects';
import { getGalleryHeroImages } from '@/data/gallery';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export const revalidate = 60;

export default async function Home() {
  const achievements = await getAchievementsData();
  const projects = await getProjectsData();
  const heroImages = await getGalleryHeroImages();
  
  // Get featured achievements, fallback to newest 3 if none are featured yet
  const featuredAchievements = achievements.filter(a => a.isFeatured).slice(0, 3);
  const displayAchievements = featuredAchievements.length > 0 ? featuredAchievements : achievements.slice(0, 3);

  // Get starred projects, fallback to newest 3
  const starredProjects = projects.filter(p => p.isStarred).slice(0, 3);
  const displayProjects = starredProjects.length > 0 ? starredProjects : projects.slice(0, 3);

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

      {/* Modern 3D Vibrant Key Statistics */}
      <Stats3DSection />

      {/* Modern 3D The Standard of Excellence (SuperMellow font & multi-colored 3D) */}
      <StandardOfExcellence3D />

      {/* Featured Achievements */}
      <section className="section-achievements-preview">
          <div className="container">
              <div className="section-header reveal-fade text-center">
                  <h2 className="section-title">Hall of Fame</h2>
              </div>
              <div className={`competitions-grid ${displayAchievements.length === 1 ? 'single-comp' : ''}`}>
                  {displayAchievements.map((achievement, index) => (
                    <div key={achievement.slug} className={`comp-card reveal-fade up ${index > 0 ? `delay-${index}` : ''}`}>
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
              <div className="section-header reveal-fade text-center" style={{ marginBottom: '4rem' }}>
                  <h2 className="section-title">Our Projects</h2>
                  <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '1rem' }}>Discover the initiatives driven by our society.</p>
              </div>
              <div className={`competitions-grid ${displayProjects.length === 1 ? 'single-comp' : ''}`}>
                  {displayProjects.map((project, index) => (
                    <div key={project.slug} className={`comp-card reveal-fade up ${index > 0 ? `delay-${index}` : ''}`}>
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
              <div className="section-header reveal-fade">
                  <h2 className="section-title">Moments of Glory</h2>
              </div>
              
              <div className="gallery-wrapper reveal-fade up" style={{ transform: 'scale(0.7)', margin: '-2rem 0' }}>
                  <div className="gallery-3d-container">
                      <div className="gallery-spinner">
                          <div className="gallery-center-pillar">
                            <div className="gallery-center-glow" />
                            <img src="/bar.png" alt="NCQC Center Emblem" className="gallery-center-logo" />
                          </div>
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
