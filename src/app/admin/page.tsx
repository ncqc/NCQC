'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

interface DashboardData {
  stats: {
    totalAchievements: number;
    totalCompetitions: number;
    totalProjects: number;
    totalGalleryImages: number;
  };
  supabase: {
    online: boolean;
    statusText: string;
  };
  storage: {
    fileCount: number;
    usedMb: string;
    maxMb: number;
    percentage: string;
  };
  maintenance: {
    maintenanceMode: boolean;
    maintenanceNotice: string;
    estimatedEndTime: string;
    updatedAt?: string;
  };
  competitions: Array<{
    slug: string;
    title: string;
    eventDate: string;
    deadline?: string;
    image: string;
    isExpired: boolean;
    timeRemainingText: string;
  }>;
  recentActivities: Array<{
    type: string;
    title: string;
    badge: string;
    action: string;
    color: string;
    icon: string;
    link: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [etaDraft, setEtaDraft] = useState('');
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setNoticeDraft(json.data.maintenance.maintenanceNotice || '');
        setEtaDraft(json.data.maintenance.estimatedEndTime || 'Coming Soon');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/competitions/sync', { method: 'POST' });
      const resData = await res.json();
      if (resData.success) {
        alert('✅ ' + resData.message);
        fetchDashboardData();
      } else if (resData.rlsBlocked) {
        alert(
          '⚠️ Supabase Permission Notice:\n' +
          'Please ensure table "competition" has RLS disabled or granted to anon in Supabase.'
        );
      } else {
        alert('Sync error: ' + (resData.error || 'Failed to sync'));
      }
    } catch (e: any) {
      alert('Network error while syncing: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleMaintenance = async (newMode: boolean) => {
    setIsSavingMaintenance(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceMode: newMode,
          maintenanceNotice: noticeDraft,
          estimatedEndTime: etaDraft
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setData(prev => prev ? {
          ...prev,
          maintenance: resData.settings
        } : prev);
        alert(newMode 
          ? '⚠️ Maintenance Mode Activated! Public visitors will now see the Maintenance page. Admin panel remains accessible.' 
          : '🟢 Maintenance Mode Deactivated! Public website is now live for all visitors.');
      } else {
        alert('Failed to update maintenance mode: ' + resData.error);
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Top Header & Global Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 className="admin-title" style={{ margin: '0 0 0.3rem 0', fontSize: '2rem', fontWeight: 900 }}>
            Dashboard Overview
          </h1>
          <p className="admin-subtitle" style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Welcome to the Nalanda College Quiz Club Command Center.
          </p>
        </div>

        {/* Global Status Badges & Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Supabase Connection Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            background: data?.supabase.online ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${data?.supabase.online ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: data?.supabase.online ? '#065f46' : '#991b1b'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: data?.supabase.online ? '#10b981' : '#ef4444',
              display: 'inline-block',
              boxShadow: `0 0 8px ${data?.supabase.online ? '#10b981' : '#ef4444'}`
            }} />
            <span>Database: {data?.supabase.online ? 'Online (Supabase)' : 'Connecting...'}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.1rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: isSyncing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)'
            }}
            title="Force synchronization with Supabase Database"
          >
            <span>{isSyncing ? '⏳' : '🔄'}</span>
            <span>{isSyncing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          {/* Live Site Link */}
          <Link
            href="/"
            target="_blank"
            style={{
              background: '#111827',
              color: '#ffffff',
              padding: '0.6rem 1.1rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(17, 24, 39, 0.2)'
            }}
          >
            <span>🌐</span>
            <span>Visit Live Site ↗</span>
          </Link>
        </div>
      </div>

      {/* 🛠️ Maintenance Mode Banner & Controller */}
      <div style={{
        background: data?.maintenance.maintenanceMode 
          ? 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)' 
          : '#ffffff',
        border: `1.5px solid ${data?.maintenance.maintenanceMode ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: data?.maintenance.maintenanceMode 
          ? '0 10px 25px rgba(239, 68, 68, 0.12)' 
          : '0 4px 20px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: data?.maintenance.maintenanceMode ? '#ef4444' : '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: `0 4px 12px ${data?.maintenance.maintenanceMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
            }}>
              {data?.maintenance.maintenanceMode ? '🚧' : '🌐'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Maintenance Mode
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '100px',
                  background: data?.maintenance.maintenanceMode ? '#fee2e2' : '#ecfdf5',
                  color: data?.maintenance.maintenanceMode ? '#b91c1c' : '#047857',
                  border: `1px solid ${data?.maintenance.maintenanceMode ? '#fca5a5' : '#a7f3d0'}`
                }}>
                  {data?.maintenance.maintenanceMode ? '● ACTIVE (SITE UNDER MAINTENANCE)' : '● DEACTIVATED (SITE LIVE)'}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                {data?.maintenance.maintenanceMode 
                  ? 'Public visitors see the scheduled maintenance page. You can still access this admin panel without restrictions.'
                  : 'All public website pages are accessible to visitors normally.'}
              </p>
            </div>
          </div>

          {/* Toggle Button & Options */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowMaintenanceSettings(!showMaintenanceSettings)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              ⚙️ {showMaintenanceSettings ? 'Hide Message Config' : 'Configure Notice'}
            </button>
            <button
              onClick={() => handleToggleMaintenance(!data?.maintenance.maintenanceMode)}
              disabled={isSavingMaintenance}
              style={{
                background: data?.maintenance.maintenanceMode ? '#10b981' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.4rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: isSavingMaintenance ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: data?.maintenance.maintenanceMode 
                  ? '0 4px 14px rgba(16, 185, 129, 0.3)' 
                  : '0 4px 14px rgba(220, 38, 38, 0.3)'
              }}
            >
              <span>{isSavingMaintenance ? '⏳' : (data?.maintenance.maintenanceMode ? '🟢 Turn OFF (Make Live)' : '🚧 Turn ON (Maintenance)')}</span>
            </button>
          </div>
        </div>

        {/* Expandable Maintenance Message Configuration */}
        {showMaintenanceSettings && (
          <div className="maintenance-settings-grid" style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                Maintenance Notice for Visitors:
              </label>
              <textarea
                value={noticeDraft}
                onChange={(e) => setNoticeDraft(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                Estimated Resumption (ETA):
              </label>
              <input
                type="text"
                value={etaDraft}
                onChange={(e) => setEtaDraft(e.target.value)}
                placeholder="e.g. October 15 at 6:00 PM"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  marginBottom: '0.5rem'
                }}
              />
              <button
                onClick={() => handleToggleMaintenance(!!data?.maintenance.maintenanceMode)}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Message Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 📊 The 4 Real-time Statistics Cards (Real Counts) */}
      <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
        {[
          {
            title: 'Total Achievements',
            count: loading ? '...' : String(data?.stats.totalAchievements ?? 0),
            color: 'bg-blue',
            icon: '🏆',
            link: '/admin/achievements',
            subtitle: 'Honors & Championships'
          },
          {
            title: 'Competitions',
            count: loading ? '...' : String(data?.stats.totalCompetitions ?? 0),
            color: 'bg-red',
            icon: '⚔️',
            link: '/admin/competitions',
            subtitle: `${data?.competitions.filter(c => !c.isExpired).length || 0} active now`
          },
          {
            title: 'Flagship Projects',
            count: loading ? '...' : String(data?.stats.totalProjects ?? 0),
            color: 'bg-green',
            icon: '🚀',
            link: '/admin/projects',
            subtitle: 'Annual & Intra Initiatives'
          },
          {
            title: 'Gallery Media',
            count: loading ? '...' : String(data?.storage.fileCount ?? 0),
            color: 'bg-purple',
            icon: '📸',
            link: '/admin/gallery',
            subtitle: `${data?.storage.usedMb ?? '0'} MB Storage Used`
          },
        ].map((stat, idx) => (
          <Link
            key={idx}
            href={stat.link}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="stat-card" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}>
              <div className={`stat-icon ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{stat.title}</p>
                <h3 style={{ margin: '0.2rem 0', fontSize: '1.9rem', fontWeight: 900, color: '#0f172a' }}>{stat.count}</h3>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{stat.subtitle} &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 2-Column Core Intelligence Grid */}
      <div className="dashboard-intel-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '2rem'
      }}>
        {/* Left Column: Competitions Tracker & Recent Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* ⚔️ Competitions & Deadlines Tracker (තරඟ සහ ඩෙඩ්ලයින් නිරීක්ෂකය) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>⚔️</span>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Competitions & Deadlines Tracker
                </h2>
              </div>
              <Link 
                href="/admin/competitions"
                style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}
              >
                Manage All &rarr;
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading competitions...</div>
            ) : (data?.competitions.length || 0) === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No competitions found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data?.competitions.map((comp) => (
                  <div
                    key={comp.slug}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#0f172a',
                        flexShrink: 0
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={comp.image} 
                          alt={stripStyledText(comp.title)} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => (e.currentTarget.src = '/comp1.jpg')}
                        />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <RenderStyledText text={comp.title} />
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            📅 {comp.eventDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        background: comp.isExpired ? '#fee2e2' : '#dcfce7',
                        color: comp.isExpired ? '#dc2626' : '#15803d',
                        border: `1px solid ${comp.isExpired ? '#fca5a5' : '#86efac'}`
                      }}>
                        {comp.timeRemainingText}
                      </span>
                      <Link
                        href={`/admin/competitions/${encodeURIComponent(comp.slug.trim())}`}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#334155',
                          textDecoration: 'none'
                        }}
                      >
                        Edit ✏️
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📋 Recent Activities & Audit Log (මෑතකදී කළ වෙනස්කම්) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📋</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Recent System Activity
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(data?.recentActivities || []).map((act, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.85rem',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{act.icon}</span>
                    <div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: act.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {act.badge}
                      </span>
                      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                        <RenderStyledText text={act.title} />
                      </p>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{act.action}</span>
                    </div>
                  </div>

                  <Link
                    href={act.link}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#2563eb',
                      textDecoration: 'none'
                    }}
                  >
                    View &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Supabase Storage Monitor & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* ☁️ Supabase Cloud Storage Monitor (Storage සහ Media භාවිතය) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>☁️</span>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Supabase Storage Monitor
                </h2>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#059669',
                background: '#ecfdf5',
                padding: '0.2rem 0.6rem',
                borderRadius: '100px',
                border: '1px solid #a7f3d0'
              }}>
                Bucket: images
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Real-time image storage quota allocated for posters, achievements, and albums.
            </p>

            {/* Storage Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>TOTAL UPLOADED</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  {data?.storage.fileCount ?? 0} Files
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>USED CAPACITY</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  {data?.storage.usedMb ?? '0.00'} MB
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569' }}>
                <span>Usage: {data?.storage.percentage ?? '0.00'}%</span>
                <span>Limit: {data?.storage.maxMb ?? 1024} MB (1 GB)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.max(2, Number(data?.storage.percentage || 0))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: '100px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>
                🟢 Plenty of room available ({(1024 - Number(data?.storage.usedMb || 0)).toFixed(1)} MB remaining)
              </span>
            </div>

            <Link
              href="/admin/gallery"
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '0.6rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Open Gallery & Albums Management &rarr;
            </Link>
          </div>

          {/* ⚡ Quick Actions (විධානයන්) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
              Quick Creation Hub
            </h2>

            <div className="quick-hub-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
              <Link
                href="/admin/competitions"
                style={{
                  background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                  color: '#fff',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)'
                }}
              >
                <span>⚔️</span>
                <span>+ Competition</span>
              </Link>

              <Link
                href="/admin/achievements"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <span>🏆</span>
                <span>+ Achievement</span>
              </Link>

              <Link
                href="/admin/projects"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#fff',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                <span>🚀</span>
                <span>+ Project</span>
              </Link>

              <Link
                href="/admin/gallery"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                }}
              >
                <span>📸</span>
                <span>+ Photo Album</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
