import { notFound } from 'next/navigation';
import { getProject, getProjectsData } from '@/data/projects';
import Link from 'next/link';
import 'react-quill-new/dist/quill.snow.css';
import { formatPublicHtml } from '@/utils/sanitizeHtml';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export async function generateStaticParams() {
  const projects = await getProjectsData();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="container comp-details-single-container">
        <div className="comp-main reveal-fade up is-visible" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '2rem' }}>
              <Link href="/projects" className="btn-back-link">
                &larr; Back to Projects
              </Link>
            </div>

            {/* Category Tag & Frequency */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(217, 4, 41, 0.08)', color: '#d90429', fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 1rem', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <RenderStyledText text={project.type} />
              </span>
              <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>
                &bull; <RenderStyledText text={project.frequency} />
              </span>
            </div>

            {/* Main Page Title */}
            <h1 className="comp-page-title" style={{ marginBottom: '1rem', maxWidth: '700px', lineHeight: 1.2 }}>
              <RenderStyledText text={project.title} />
            </h1>

            <p className="comp-org" style={{ marginBottom: '3rem', fontSize: '1.2rem', color: '#64748b' }}>
              An Initiative by Nalanda College Quiz Club
            </p>

            {/* Main Poster / Hero Image - Sized prominently like achievements */}
            {project.image && (
              <div style={{ 
                width: '100%', 
                maxWidth: '700px', 
                marginBottom: '3.5rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <img 
                  src={project.image} 
                  alt={stripStyledText(project.title)} 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '600px',
                    borderRadius: '24px', 
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12)', 
                    objectFit: 'contain',
                    background: project.image.includes('logo') ? '#fff' : 'transparent',
                    padding: project.image.includes('logo') ? '3rem' : '0'
                  }} 
                />
              </div>
            )}

            {/* Quill Content Area */}
            <div className="flowing-details" style={{ textAlign: 'left', width: '100%' }}>
                <div className="detail-section">
                    {project.contentHtml ? (
                      <div 
                        className="quill-content ql-editor"
                        dangerouslySetInnerHTML={{ __html: formatPublicHtml(project.contentHtml) }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '1.15rem', color: '#475569', lineHeight: 1.8 }}>
                        <p style={{ fontStyle: 'italic', color: '#64748b' }}>{project.shortDesc}</p>
                        {project.fullDesc && project.fullDesc.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
}
