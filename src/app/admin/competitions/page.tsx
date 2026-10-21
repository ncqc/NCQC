'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { competitionsData, Competition } from '@/data/competitions';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

export default function CompetitionsAdmin() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>(competitionsData);
  const [starredSlugs, setStarredSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUpcomingBattles, setShowUpcomingBattles] = useState<boolean>(true);
  const [isSavingVisibility, setIsSavingVisibility] = useState<boolean>(false);

  const loadCompetitions = async () => {
    let currentStarred: string[] = [];
    try {
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setData.success && setData.settings) {
        setShowUpcomingBattles(setData.settings.showUpcomingBattles !== false);
        currentStarred = setData.settings.starredCompetitionSlugs || [];
        setStarredSlugs(currentStarred);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    try {
      const compRes = await fetch('/api/competitions');
      const compData = await compRes.json();
      if (compData.success && compData.data && compData.data.length > 0) {
        setCompetitions((compData.data as Competition[]).map(c => ({
          ...c,
          isStarred: currentStarred.includes(c.slug)
        })));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Competitions API fetch notice, falling back:', err);
    }

    // Fallback to local
    setCompetitions(competitionsData.map(c => ({
      ...c,
      isStarred: currentStarred.includes(c.slug)
    })));
    setLoading(false);
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  const handleToggleUpcomingBattles = async () => {
    const nextVal = !showUpcomingBattles;
    setShowUpcomingBattles(nextVal);
    setIsSavingVisibility(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showUpcomingBattles: nextVal })
      });
      const data = await res.json();
      if (data.success) {
        alert(nextVal 
          ? '✅ "Upcoming Battles" section is now VISIBLE on the Home Page!' 
          : '⚪ "Upcoming Battles" section is now HIDDEN on the Home Page. The space has been collapsed without any empty gaps!');
      } else {
        alert('Failed to update setting: ' + (data.error || 'Unknown error'));
        setShowUpcomingBattles(!nextVal);
      }
    } catch (e: any) {
      alert('Error updating setting: ' + e.message);
      setShowUpcomingBattles(!nextVal);
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const handleToggleStar = async (slug: string) => {
    const targetComp = competitions.find(c => c.slug === slug);
    if (!targetComp) return;

    const willBeStarred = !targetComp.isStarred;
    if (willBeStarred) {
      const currentStarredCount = competitions.filter(c => c.isStarred).length;
      if (currentStarredCount >= 3) {
        alert('⚠️ You can only feature a maximum of 3 competitions on the Home Page!\n\nPlease un-star (★) another competition first before featuring this one.');
        return;
      }
    }

    const nextStarred = willBeStarred
      ? Array.from(new Set([...starredSlugs, slug]))
      : starredSlugs.filter(s => s !== slug);

    setStarredSlugs(nextStarred);
    setCompetitions(competitions.map(c => 
      c.slug === slug ? { ...c, isStarred: willBeStarred } : c
    ));

    try {
      // 1. Save to settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starredCompetitionSlugs: nextStarred })
      });
      // 2. Local API update
      await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetComp, isStarred: willBeStarred })
      });
    } catch (e) {
      console.error('Star update error:', e);
    }
  };

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
          'In your Supabase Studio (as seen in Image 2):\n' +
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
    if (confirm('Are you sure you want to delete this competition?')) {
      const cleanSlug = slug.trim();
      const newData = competitions.filter(c => (c.slug || '').trim() !== cleanSlug);
      setCompetitions(newData);
      
      try {
        const res = await fetch(`/api/competitions?slug=${encodeURIComponent(cleanSlug)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.supabaseNotice) {
          console.warn('Supabase delete notice:', data.supabaseNotice);
        }
      } catch (e) {
        console.error('Delete error:', e);
      }
    }
  };

  const handleAddNew = async () => {
    const newSlug = `competition-${Date.now()}`;
    const newComp: Competition = {
      slug: newSlug,
      title: 'New Competition 2026',
      date: 'December 15, 2026',
      eventDate: 'December 15, 2026',
      deadline: 'December 15, 2026 at 12:00 AM',
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

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <header className="achievements-header" style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-title">Manage Competitions</h1>
          <p className="admin-subtitle">Add, edit, or remove competitions shown on the website.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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

      {/* Home Page Upcoming Battles Visibility & Star Controls Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem'
      }}>
        <div style={{ maxWidth: '620px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚔️</span>
            <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
              Home Page &ldquo;Upcoming Battles&rdquo; Section Control
            </h2>
            <span style={{
              background: showUpcomingBattles ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
              color: showUpcomingBattles ? '#34d399' : '#94a3b8',
              border: `1px solid ${showUpcomingBattles ? '#059669' : '#475569'}`,
              borderRadius: '9999px',
              padding: '0.2rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {showUpcomingBattles ? '● Active on Home' : '○ Section Hidden'}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            When toggled <strong>OFF</strong>, the Upcoming Battles section completely disappears from the public Home Page and the section below (&ldquo;Hall of Fame&rdquo;) shifts up smoothly without leaving any empty blank space.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              ⭐ Featured on Home: {competitions.filter(c => c.isStarred).length} / 3 Max
            </span>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
              Only Starred (★) competitions appear in the Home Page carousel (Strict limit: 3).
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            onClick={handleToggleUpcomingBattles}
            disabled={isSavingVisibility}
            style={{
              background: showUpcomingBattles 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.85rem 1.6rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isSavingVisibility ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: showUpcomingBattles 
                ? '0 4px 15px rgba(239, 68, 68, 0.4)' 
                : '0 4px 15px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{showUpcomingBattles ? '🚫' : '👁️'}</span>
            <span>{isSavingVisibility ? 'Updating...' : (showUpcomingBattles ? 'Hide Section on Home' : 'Show Section on Home')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading competitions...</div>
      ) : (
        <div className="competitions-grid">
          {competitions.map((comp) => {
            const isStarred = !!comp.isStarred;
            return (
              <div key={comp.slug} className="comp-card" style={{ transition: 'all 0.3s', position: 'relative' }}>
                {isStarred && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    zIndex: 10,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    letterSpacing: '0.03em'
                  }}>
                    <span>★</span> Featured on Home
                  </div>
                )}
                <div className="comp-img-wrapper" style={{ position: 'relative' }}>
                  <img src={comp.image} alt={stripStyledText(comp.title)} className="comp-img" style={{ objectFit: 'cover' }} onError={(e) => (e.currentTarget.src = '/comp1.jpg')} />
                </div>
                <div className="comp-info" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem 1.25rem 1.5rem', flex: 1 }}>
                  <h3 className="comp-title" style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.65rem', textAlign: 'center', lineHeight: 1.3 }}>
                    <RenderStyledText text={comp.title} />
                  </h3>
                  
                  {/* Event Date Badge */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '100px',
                      padding: '0.35rem 0.95rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      <span style={{ color: '#dc2626' }}>📅</span>
                      <span><strong>Event:</strong> {comp.eventDate || comp.date}</span>
                    </div>
                  </div>

                  {/* Clean Short Description with proper spacing and clamp */}
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
                  
                  {/* Action Buttons Row with Star Button */}
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleStar(comp.slug)}
                      style={{
                        background: isStarred 
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                          : '#ffffff',
                        color: isStarred ? '#fff' : '#64748b',
                        border: isStarred ? 'none' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.95rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease',
                        boxShadow: isStarred ? '0 4px 12px rgba(245, 158, 11, 0.35)' : '0 1px 2px rgba(0,0,0,0.04)'
                      }}
                      title={isStarred ? "Remove from Home Featured (★)" : "Feature on Home Upcoming Battles (Max 3) (★)"}
                    >
                      <span style={{ fontSize: '0.95rem', color: isStarred ? '#fff' : '#f59e0b' }}>
                        {isStarred ? '★' : '☆'}
                      </span>
                      <span>{isStarred ? 'Featured' : 'Feature'}</span>
                    </button>

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
                      title="Delete Competition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {competitions.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No competitions found. Add your first one!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
