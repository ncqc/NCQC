'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/data/projects';
import { useRouter } from 'next/navigation';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (json.success && json.data) {
        setProjects(json.data as Project[]);
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
    }
    setLoading(false);
  };

  const handleCreateNew = async () => {
    const newSlug = `new-project-${Date.now()}`;
    const newProject: Project = {
      slug: newSlug,
      title: 'New Project',
      type: 'Event',
      frequency: 'Annual',
      shortDesc: 'A brief description of this project.',
      image: '/bar.png',
      contentHtml: '<h1>New Project</h1><p>Start writing here...</p>',
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/admin/projects/${newSlug}`);
      } else {
        alert(`Failed to create new project: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Insert error:', err);
      alert(`Failed to create new project: ${err.message || 'Error'}`);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/projects?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
        router.refresh();
      } else {
        alert(`Failed to delete: ${data.error || 'Error'}`);
      }
    } catch (e: any) {
      console.error('Delete error:', e);
      alert(`Delete error: ${e.message}`);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div style={{ padding: '2rem', background: '#f3f4f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.35rem 0' }}>Manage Projects</h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span>Choose up to 3 featured projects for the Home Page:</span>
            <span style={{ 
              background: projects.filter(p => p.isStarred).length >= 3 ? '#fee2e2' : '#fef3c7', 
              color: projects.filter(p => p.isStarred).length >= 3 ? '#b91c1c' : '#b45309', 
              fontWeight: 800, 
              padding: '0.2rem 0.65rem', 
              borderRadius: '6px',
              fontSize: '0.8rem',
              border: projects.filter(p => p.isStarred).length >= 3 ? '1px solid #fca5a5' : '1px solid #fde68a'
            }}>
              ⭐ {projects.filter(p => p.isStarred).length} / 3 Featured
            </span>
          </p>
        </div>
        <button 
          onClick={handleCreateNew}
          style={{ background: '#dc2626', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
        >
          + Add New Project
        </button>
      </div>

      <div className="competitions-grid">
        {projects.map(proj => (
          <div key={proj.slug} className="comp-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="comp-img-wrapper" style={{ height: '200px' }}>
              <img src={proj.image} alt={stripStyledText(proj.title)} className="comp-img" style={{ objectFit: proj.image.includes('logo') ? 'contain' : 'cover' }} />
            </div>
            <div className="comp-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 className="comp-title"><RenderStyledText text={proj.title} /></h3>
              <p style={{ color: '#64748b', marginBottom: '1rem', flex: 1 }}>
                <RenderStyledText text={proj.type} /> • <RenderStyledText text={proj.frequency} />
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/projects/${proj.slug}`} style={{ background: '#111827', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                  Edit
                </Link>
                <button 
                  onClick={async () => {
                    try {
                      const isCurrentlyStarred = !!proj.isStarred;
                      const newStatus = !isCurrentlyStarred;
                      if (newStatus) {
                        const currentStarredCount = projects.filter(p => p.isStarred).length;
                        if (currentStarredCount >= 3) {
                          alert('⚠️ Maximum 3 projects can be featured on the Home Page. Please unstar an existing project first.');
                          return;
                        }
                      }
                      const res = await fetch('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...proj, isStarred: newStatus })
                      });
                      const data = await res.json();
                      if (!data.success) throw new Error(data.error || 'Failed');
                      setProjects(projects.map(p => p.slug === proj.slug ? { ...p, isStarred: newStatus } : p));
                      router.refresh();
                    } catch (err: any) {
                      alert(err.message || 'Failed to update star status');
                    }
                  }}
                  style={{ background: proj.isStarred ? '#fbbf24' : '#e5e7eb', color: proj.isStarred ? '#fff' : '#6b7280', padding: '0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={proj.isStarred ? 'Unstar Project (Featured on Home)' : 'Star Project (Feature on Home - Max 3)'}
                >
                  ★
                </button>
                <button 
                  onClick={() => handleDelete(proj.slug)}
                  style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  title="Delete Project"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
