'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
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
    const { data, error } = await supabase
      .from('project')
      .select('*')
      .order('title', { ascending: true });
    
    if (data) setProjects(data as Project[]);
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
      image: '/comp1.jpg',
      contentHtml: '<h1>New Project</h1><p>Start writing here...</p>',
    };

    const { error } = await supabase.from('project').insert(newProject);
    if (!error) {
      router.push(`/admin/projects/${newSlug}`);
    } else {
      console.error('Insert error:', error);
      alert(`Failed to create new project: ${error.message || error.details || 'Unknown error'}`);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await supabase.from('project').delete().eq('slug', slug);
    if (!error) {
      fetchProjects();
      router.refresh();
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div style={{ padding: '2rem', background: '#f3f4f6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Projects</h1>
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
                      const newStatus = !proj.isStarred;
                      const { error } = await supabase.from('project').update({ isStarred: newStatus }).eq('slug', proj.slug);
                      if (error) throw error;
                      setProjects(projects.map(p => p.slug === proj.slug ? { ...p, isStarred: newStatus } : p));
                      router.refresh();
                    } catch (err) {
                      alert('Failed to update star status');
                    }
                  }}
                  style={{ background: proj.isStarred ? '#fbbf24' : '#e5e7eb', color: proj.isStarred ? '#fff' : '#6b7280', padding: '0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={proj.isStarred ? 'Unstar Project' : 'Star Project'}
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
