import Link from 'next/link';
import { getProjectsData } from '@/data/projects';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projectsData = await getProjectsData();
  
  return (
    <section className="about-hero" style={{ paddingTop: '15rem' }}>
      <div className="container">
        <div className="reveal-text">
          <h1 className="page-title" style={{ textAlign: 'center', color: '#111', WebkitTextStroke: '0', fontFamily: 'var(--font-super-mellow), "SuperMellow", sans-serif' }}>Our Projects</h1>
        </div>
        <div className="about-content reveal-fade delay-1 is-visible">
          <div className="lead-pill-wrap">
            <div className="lead-pill-badge">
              <span className="lead-pill-dot"></span>
              <span className="lead-pill-text" style={{ color: '#64748b' }}>Innovative initiatives to elevate the quizzing standard in Sri Lanka.</span>
            </div>
          </div>
          
          <h2 className="section-subtitle">Flagship Events</h2>
          
          <div className="competitions-grid">
            {projectsData.map((project) => (
              <div key={project.slug} className="comp-card reveal-fade up is-visible">
                <div className="comp-img-wrapper">
                  <img src={project.image} alt={stripStyledText(project.title)} className="comp-img" />
                </div>
                <div className="comp-info">
                  <h3 className="comp-title" style={{ fontSize: '1.25rem' }}>
                    <RenderStyledText text={project.title} />
                  </h3>
                  <div className="comp-date-wrapper" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#64748b', padding: '0 1rem', flex: 1 }}>
                    <RenderStyledText text={project.shortDesc} />
                  </div>
                  <div className="comp-divider"></div>
                  <Link href={`/projects/${project.slug}`} prefetch={true} className="comp-btn-modern">
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
