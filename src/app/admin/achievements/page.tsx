'use client';
import { useState, useEffect } from 'react';
import { Achievement } from '@/data/achievements';
import Link from 'next/link';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export default function AchievementsAdminGrid() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/achievements');
      const json = await res.json();
      if (json.success && json.data) {
        setAchievements(json.data as Achievement[]);
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const router = require('next/navigation').useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNew = async () => {
    setIsAdding(true);
    const newSlug = `new-achievement-${Date.now()}`;
    const newAch: Achievement = {
      slug: newSlug,
      title: 'New Achievement Title',
      type: 'Award',
      year: new Date().getFullYear().toString(),
      shortDesc: 'Click edit to change this short description.',
      fullDesc: ['Click edit to change this full description paragraph.'],
      image: '/bar.png'
    };

    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAch)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create');
      
      router.push(`/admin/achievements/${newSlug}`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to create new achievement: ' + (err.message || 'Error'));
      setIsAdding(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    
    try {
      const res = await fetch(`/api/achievements?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete');

      setAchievements(achievements.filter(a => a.slug !== slug));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete achievement: ' + (err.message || 'Error'));
    }
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <header className="achievements-header" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-title">Visual Editor: Achievements</h1>
          <p className="admin-subtitle">Select an achievement below to edit it exactly as it looks on the live website.</p>
        </div>
        <button 
          onClick={handleAddNew} 
          disabled={isAdding}
          style={{ 
            background: '#dc2626', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
            borderRadius: '12px', fontWeight: 'bold', cursor: isAdding ? 'wait' : 'pointer',
            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
          }}
        >
          {isAdding ? 'Creating...' : '➕ Add New Achievement'}
        </button>
      </header>
      
      <div className="competitions-grid">
        {achievements.map((achievement) => (
          <div key={achievement.slug} className="comp-card" style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
            <div className="comp-img-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={achievement.image} alt={stripStyledText(achievement.title)} className="comp-img" style={{ objectFit: achievement.image.includes('logo') ? 'contain' : 'cover', padding: achievement.image.includes('logo') ? '2rem' : '0' }} />
            </div>
            <div className="comp-info">
              <h3 className="comp-title" style={{ fontSize: '1.25rem' }}><RenderStyledText text={achievement.title} /> (<RenderStyledText text={achievement.year} />)</h3>
              <div className="comp-date-wrapper" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#64748b', padding: '0 1rem', flex: 1 }}>
                <RenderStyledText text={achievement.shortDesc} />
              </div>
              <div className="comp-divider"></div>
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem' }}>
                <Link href={`/admin/achievements/${achievement.slug}`} className="comp-btn-modern" style={{ background: '#dc2626', color: '#fff', border: 'none', textAlign: 'center', flex: 1, padding: '0.8rem' }}>
                  ✏️ Edit Visually
                </Link>
                <button 
                  onClick={() => handleDelete(achievement.slug)}
                  style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                  title="Delete"
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
