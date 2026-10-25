'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TeamMember, defaultTeamMembers } from '@/data/team';
import { maskImageUrl } from '@/utils/media';

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(defaultTeamMembers);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'executive'>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const sqlQuery = `-- 1. Create team_members table in Supabase
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'executive',
  image TEXT DEFAULT '',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Grant table permissions to public anon & authenticated roles
GRANT ALL ON TABLE public.team_members TO anon, authenticated, service_role;

-- 3. Disable Row Level Security (RLS) so your admin panel can read and write directly
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;`;

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setMembers(json.data);
      }
    } catch (e) {
      console.warn('Failed to load team from API, using default:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleFieldChange = (id: string, field: keyof TeamMember, value: any) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleFileUpload = async (memberId: string, file: File) => {
    if (!file) return;
    setUploadingId(memberId);
    setStatusMessage({ text: 'Compressing and converting image to WebP...', type: 'warn' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        handleFieldChange(memberId, 'image', data.url);
        setStatusMessage({ text: '✅ Image converted to WebP and uploaded successfully! Remember to Save Changes.', type: 'success' });
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
        setStatusMessage({ text: '❌ Upload failed: ' + (data.error || 'Unknown error'), type: 'error' });
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
      setStatusMessage({ text: '❌ Network error during upload', type: 'error' });
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemovePhoto = (id: string) => {
    handleFieldChange(id, 'image', '');
    setStatusMessage({ text: 'Photo removed. Remember to Save Changes.', type: 'warn' });
  };

  const handleAddNewMember = (category: 'teacher' | 'executive') => {
    const newId = `${category}-${Date.now()}`;
    const newMember: TeamMember = {
      id: newId,
      name: category === 'teacher' ? 'New Teacher' : 'New Committee Member',
      role: category === 'teacher' ? 'Teacher-In-Charge' : 'Executive Member',
      category,
      image: '',
      orderIndex: members.length + 1
    };

    setMembers(prev => [...prev, newMember]);
    setStatusMessage({ text: `➕ Added new ${category} member. Configure name and upload photo, then Save Changes.`, type: 'success' });
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from Our Team?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
      setStatusMessage({ text: `Removed ${name}. Click Save Changes to finalize.`, type: 'warn' });
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMessage({ text: 'Saving team members to database...', type: 'warn' });

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members })
      });

      const data = await res.json();

      if (data.success) {
        if (data.supabaseSuccess) {
          setStatusMessage({ text: '✅ Saved to Supabase Database and local storage!', type: 'success' });
          alert('✅ Team members saved to Supabase and published successfully!');
        } else {
          setStatusMessage({ 
            text: '⚠️ Saved locally! Note: Supabase table "team_members" not found. Click "📋 Supabase SQL Schema" above to create it in Supabase.', 
            type: 'warn' 
          });
          alert('⚠️ Saved locally and active on website!\n\nTo sync directly with Supabase, create the "team_members" table using the SQL schema button at the top.');
        }
      } else {
        alert('Save error: ' + (data.error || 'Failed to save'));
        setStatusMessage({ text: '❌ Error: ' + data.error, type: 'error' });
      }
    } catch (e: any) {
      alert('Save failed: ' + e.message);
      setStatusMessage({ text: '❌ Save failed: ' + e.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const filteredMembers = activeTab === 'all' 
    ? members 
    : members.filter(m => m.category === activeTab);

  const teacherCount = members.filter(m => m.category === 'teacher').length;
  const execCount = members.filter(m => m.category === 'executive').length;

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👥</span>
            <h1 className="admin-title" style={{ margin: 0 }}>Manage Our Team</h1>
          </div>
          <p className="admin-subtitle" style={{ margin: 0, fontSize: '0.88rem' }}>
            Upload WebP portrait photos, edit leadership roles, and sync with Supabase Cloud Database.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1.5px solid #cbd5e1',
              padding: '0.7rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
            }}
            title="View Supabase Table SQL"
          >
            <span>📋</span> Supabase SQL Schema
          </button>

          <button
            type="button"
            onClick={() => handleAddNewMember('executive')}
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: '1.5px solid #94a3b8',
              padding: '0.7rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>➕</span> Add Member
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(185, 28, 28, 0.3)'
            }}
          >
            <span>{isSaving ? '⏳' : '💾'}</span> {isSaving ? 'Saving Changes...' : 'Save & Publish All'}
          </button>
        </div>
      </header>

      {/* Real-time Status Alert Banner */}
      {statusMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: statusMessage.type === 'success' ? '#ecfdf5' : statusMessage.type === 'warn' ? '#fffbeb' : '#fef2f2',
          border: `1.5px solid ${statusMessage.type === 'success' ? '#a7f3d0' : statusMessage.type === 'warn' ? '#fde68a' : '#fca5a5'}`,
          color: statusMessage.type === 'success' ? '#065f46' : statusMessage.type === 'warn' ? '#92400e' : '#991b1b'
        }}>
          <span>{statusMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'all' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'all' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          All Members ({members.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'teacher' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'teacher' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          🎓 Teachers-In-Charge ({teacherCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('executive')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'executive' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'executive' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          ⚡ Executive Committee ({execCount})
        </button>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          Loading team members...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredMembers.map((member) => {
            const isUploading = uploadingId === member.id;

            return (
              <div
                key={member.id}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Category Badge & Delete Button */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '100px',
                    background: member.category === 'teacher' ? '#eff6ff' : '#fef2f2',
                    color: member.category === 'teacher' ? '#1d4ed8' : '#b91c1c',
                    border: `1px solid ${member.category === 'teacher' ? '#bfdbfe' : '#fecdd3'}`
                  }}>
                    {member.category === 'teacher' ? '🎓 Teacher' : '⚡ Executive'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '0.2rem'
                    }}
                    title="Delete member"
                  >
                    🗑️
                  </button>
                </div>

                {/* Avatar Preview (with Orbit Ring) */}
                <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                  {member.image ? (
                    <div
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        backgroundImage: `url("${maskImageUrl(member.image)}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '3.5px solid #ffffff',
                        boxShadow: '0 8px 22px rgba(217, 4, 41, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04)'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #ffffff 0%, #fff1f3 50%, #ffe4e8 100%)',
                        border: '3.5px solid #ffffff',
                        boxShadow: '0 8px 22px rgba(217, 4, 41, 0.12), inset 0 2px 6px rgba(255, 255, 255, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="46" height="46" fill="#d90429">
                        <path opacity="0.15" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}

                  {/* Upload Spinner Overlay */}
                  {isUploading && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      Converting...
                    </div>
                  )}
                </div>

                {/* Upload & Remove Photo Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', width: '100%', justifyContent: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => { fileInputRefs.current[member.id] = el; }}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(member.id, file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[member.id]?.click()}
                    disabled={isUploading}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: isUploading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>📷</span> {member.image ? 'Change Photo' : 'Upload Photo'}
                  </button>

                  {member.image && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(member.id)}
                      style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecdd3',
                        borderRadius: '6px',
                        padding: '0.4rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Remove custom photo and reset to placeholder"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Editable Fields */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleFieldChange(member.id, 'name', e.target.value)}
                      placeholder="e.g. Kemitha Randinu"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                      Position / Role
                    </label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => handleFieldChange(member.id, 'role', e.target.value)}
                      placeholder="e.g. President / Teacher-In-Charge"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#475569'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                      Section Category
                    </label>
                    <select
                      value={member.category}
                      onChange={(e) => handleFieldChange(member.id, 'category', e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#f8fafc',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="teacher">Teacher-In-Charge</option>
                      <option value="executive">Executive Committee</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Supabase SQL Schema Modal */}
      {showSqlModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowSqlModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '1.6rem' }}>⚡</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Supabase Table Setup (team_members)
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              To sync all team member photos and details with Supabase, open your <strong>Supabase Studio &gt; SQL Editor</strong> and run this query once:
            </p>

            <pre style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              overflowX: 'auto',
              fontFamily: 'monospace',
              lineHeight: 1.45,
              marginBottom: '1.25rem'
            }}>
              {sqlQuery}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                💡 Note: Team members are already saved locally and live on the website!
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                style={{
                  background: copiedSql ? '#059669' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedSql ? '✅ Copied to Clipboard!' : '📋 Copy SQL Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
