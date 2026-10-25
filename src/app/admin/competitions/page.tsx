'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { competitionsData, Competition } from '@/data/competitions';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

function parseDateToMs(str?: string): number | null {
  if (!str) return null;
  try {
    const cleaned = str.replace(/\bat\b/gi, ' ').replace(/\s+/g, ' ').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.getTime();
    const d2 = new Date(str);
    if (!isNaN(d2.getTime())) return d2.getTime();
  } catch {}
  return null;
}

function getCompStatus(comp: Competition, now = Date.now()): { label: string; color: string; bg: string; border: string; icon: string } {
  const deadlineMs = parseDateToMs(comp.deadline);
  const startMs = parseDateToMs(comp.startDate || comp.eventDate || comp.date);

  if (comp.statusType === 'past' || (deadlineMs !== null && now >= deadlineMs)) {
    return { label: 'Past', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', icon: '🏁' };
  }
  if (comp.statusType !== 'ongoing' && startMs !== null && now < startMs) {
    return { label: 'Upcoming', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '⏳' };
  }
  return { label: 'Ongoing', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '🟢' };
}

export default function CompetitionsAdmin() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>(competitionsData);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCompetitions = async () => {
    try {
      const compRes = await fetch('/api/competitions', { cache: 'no-store' });
      const compData = await compRes.json();
      if (compData.success && Array.isArray(compData.data)) {
        setCompetitions(compData.data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Competitions API fetch notice, falling back:', err);
    }

    // Fallback to local
    setCompetitions(competitionsData);
    setLoading(false);
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/competitions/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        loadCompetitions();
      } else if (data.rlsBlocked) {
        alert(
          '⚠️ Supabase RLS is Blocking Database Changes!\n\n' +
          'In your Supabase Studio:\n' +
          '1. Look at table "competition"\n' +
          '2. Click the "2 RLS policies" button at the top\n' +
          '3. Turn OFF / Disable RLS (or add a policy allowing anon access)\n\n' +
          'Then click this "🔄 Sync to Supabase" button again to sync all competitions!'
        );
      } else {
        alert('Sync error: ' + (data.error || 'Failed to sync'));
      }
    } catch (e: any) {
      alert('Network error while syncing: ' + e.message);
    }
    setIsSyncing(false);
  };

  const handleDelete = async (slug: string) => {
    if (confirm('Are you sure you want to permanently delete this competition? It will be deleted from both the website and Supabase database.')) {
      const cleanSlug = slug.trim();
      const prevData = [...competitions];
      setCompetitions(competitions.filter(c => (c.slug || '').trim().toLowerCase() !== cleanSlug.toLowerCase()));
      
      try {
        const res = await fetch(`/api/competitions?slug=${encodeURIComponent(cleanSlug)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!data.success) {
          alert('❌ Failed to delete from database: ' + (data.error || 'Unknown error'));
          setCompetitions(prevData);
        } else {
          await loadCompetitions();
        }
      } catch (e: any) {
        console.error('Delete error:', e);
        alert('Network error while deleting: ' + e.message);
        setCompetitions(prevData);
      }
    }
  };

  const handleAddNew = async () => {
    const newSlug = `competition-${Date.now()}`;
    const newComp: Competition = {
      slug: newSlug,
      title: 'New Competition 2026',
      date: 'December 15, 2026',
      eventDate: 'December 15, 2026 at 10:00 AM',
      startDate: 'December 15, 2026 at 10:00 AM',
      deadline: 'December 20, 2026 at 11:59 PM',
      shortDesc: 'Enter a short summary description for the competition cards.',
      fullDesc: ['Overview of the competition guidelines and eligibility requirements.'],
      image: '/comp1.jpg',
      rulesButtonText: 'Download Rules & Regs',
      rulesButtonLink: '#',
      submissionsButtonText: 'Register / Submissions →',
      submissionsButtonLink: '#',
      contentHtml: '<h1>Competition Guidelines & Rules</h1><p>Start designing your competition page content here using the Word-like ribbon editor!</p>'
    };
    
    const newData = [newComp, ...competitions];
    setCompetitions(newData);

    try {
      await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComp)
      });
    } catch (e) {
      console.error('Add new error:', e);
    }

    router.push(`/admin/competitions/${newSlug}`);
  };

  const handleAddNewPast = async () => {
    const newSlug = `competition-${Date.now()}`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const pastFormatted = `${months[yesterday.getMonth()]} ${yesterday.getDate()}, ${yesterday.getFullYear()} at 11:59 PM`;

    const newComp: Competition = {
      slug: newSlug,
      title: 'Past Competition 2025',
      date: pastFormatted,
      eventDate: pastFormatted,
      startDate: pastFormatted,
      deadline: pastFormatted,
      statusType: 'past',
      shortDesc: 'Summary of past competition, results and historical legacy.',
      fullDesc: ['Overview of the completed competition guidelines and past records.'],
      image: '/comp1.jpg',
      rulesButtonText: 'Download Rules & Regs',
      rulesButtonLink: '#',
      submissionsButtonText: 'Submissions Closed',
      submissionsButtonLink: '#',
      contentHtml: '<h1>Past Competition Guidelines & Results</h1><p>Record past competition details, guidelines, or results here.</p>'
    };
    
    const newData = [newComp, ...competitions];
    setCompetitions(newData);

    try {
      await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComp)
      });
    } catch (e) {
      console.error('Add past error:', e);
    }

    router.push(`/admin/competitions/${newSlug}`);
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <header className="achievements-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-title">Manage Competitions</h1>
          <p className="admin-subtitle">Add, edit, or remove competitions shown on the public website.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            style={{ 
              background: '#047857', color: '#fff', border: 'none', padding: '0.8rem 1.4rem', 
              borderRadius: '12px', fontWeight: 'bold', cursor: isSyncing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 15px rgba(4, 120, 87, 0.25)'
            }}
            title="Sync with Supabase Database"
          >
            <span>{isSyncing ? '⏳' : '🔄'}</span> {isSyncing ? 'Syncing...' : 'Sync to Supabase'}
          </button>
          <button 
            onClick={handleAddNewPast} 
            style={{ 
              background: '#334155', color: '#fff', border: 'none', padding: '0.8rem 1.4rem', 
              borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 15px rgba(51, 65, 85, 0.25)'
            }}
            title="Add a past / archived competition"
          >
            <span>🏁</span> Add Past Competition
          </button>
          <button 
            onClick={handleAddNew} 
            style={{ 
              background: '#b91c1c', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
              borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(185, 28, 28, 0.3)'
            }}
          >
            <span>➕</span> Add New Competition
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading competitions...</div>
      ) : (
        <div className="competitions-grid">
          {competitions.map((comp) => {
            const status = getCompStatus(comp, now);
            return (
              <div key={comp.slug} className="comp-card" style={{ transition: 'all 0.3s', position: 'relative' }}>
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 10,
                  background: status.bg,
                  color: status.color,
                  border: `1px solid ${status.border}`,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  <span>{status.icon}</span> {status.label}
                </div>

                <div className="comp-img-wrapper" style={{ position: 'relative' }}>
                  <img src={comp.image} alt={stripStyledText(comp.title)} className="comp-img" style={{ objectFit: 'cover' }} onError={(e) => (e.currentTarget.src = '/comp1.jpg')} />
                </div>
                <div className="comp-info" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem 1.25rem 1.5rem', flex: 1 }}>
                  <h3 className="comp-title" style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.65rem', textAlign: 'center', lineHeight: 1.3 }}>
                    <RenderStyledText text={comp.title} />
                  </h3>
                  
                  {/* Event & Deadline Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '100px',
                      padding: '0.28rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#475569'
                    }}>
                      <span style={{ color: '#7c3aed' }}>🗓️</span>
                      <span><strong>Starts:</strong> {comp.startDate || comp.eventDate || comp.date}</span>
                    </div>

                    {comp.deadline && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: '#fff1f2',
                        border: '1px solid #fecdd3',
                        borderRadius: '100px',
                        padding: '0.28rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#991b1b'
                      }}>
                        <span>⏰</span>
                        <span><strong>Deadline:</strong> {comp.deadline}</span>
                      </div>
                    )}
                  </div>

                  {/* Clean Short Description */}
                  <p style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    color: '#64748b',
                    margin: '0 0 1.25rem 0',
                    textAlign: 'center',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    <RenderStyledText text={comp.shortDesc} />
                  </p>

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 1.2rem 0' }} />
                  
                  {/* Action Buttons Row */}
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => router.push(`/admin/competitions/${encodeURIComponent(comp.slug.trim())}`)}
                      style={{ 
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', 
                        color: '#fff', 
                        border: 'none', 
                        textAlign: 'center', 
                        flex: 1, 
                        padding: '0.65rem 1rem', 
                        cursor: 'pointer', 
                        borderRadius: '10px', 
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>✏️</span> Edit
                    </button>

                    <Link 
                      href={`/competitions/${encodeURIComponent(comp.slug.trim())}`}
                      target="_blank"
                      style={{ 
                        background: '#f8fafc', 
                        color: '#475569', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        padding: '0.65rem 0.85rem',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem'
                      }}
                      title="Preview public page"
                    >
                      <span>👁️</span> View
                    </Link>
                    
                    <button 
                      onClick={() => handleDelete(comp.slug)}
                      style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        border: '1px solid #fecaca', 
                        borderRadius: '10px', 
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer', 
                        fontSize: '0.95rem',
                        transition: 'all 0.15s ease'
                      }}
                      title="Permanently Delete Competition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {competitions.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏆</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>No Competitions in Database</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Click &quot;Add New Competition&quot; to create your first quiz battle.</p>
              <button 
                onClick={handleAddNew} 
                style={{ 
                  background: '#b91c1c', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', 
                  borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                ➕ Add New Competition
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
