'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import './admin.css';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import AdminLoginPortal from '@/components/AdminLoginPortal';

function AdminProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, logout } = useAdminAuth();

  // If loading session from storage / auth
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#060913',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(239, 68, 68, 0.2)',
          borderTopColor: '#ef4444',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem'
        }} />
        <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', color: '#94a3b8' }}>
          VERIFYING ENCRYPTED SECURITY SESSION...
        </div>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated, render the high-security Login Portal
  if (!isAuthenticated) {
    return <AdminLoginPortal />;
  }

  // If inside visual editors, render full screen edge-to-edge
  const isFullEditor = pathname && (
    (pathname.startsWith('/admin/achievements/') && pathname !== '/admin/achievements') ||
    (pathname.startsWith('/admin/competitions/') && pathname !== '/admin/competitions') ||
    (pathname.startsWith('/admin/projects/') && pathname !== '/admin/projects')
  );

  if (isFullEditor) {
    return <main className="admin-editor-shell">{children}</main>;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Achievements', path: '/admin/achievements', icon: '🏆' },
    { name: 'Competitions', path: '/admin/competitions', icon: '⚔️' },
    { name: 'Competition Forms', path: '/admin/forms', icon: '📝' },
    { name: 'Projects', path: '/admin/projects', icon: '🚀' },
    { name: 'Gallery', path: '/admin/gallery', icon: '📸' },
  ];

  return (
    <div className="admin-wrapper">
      {/* Mobile Header with Logo & Admin Controls */}
      <div className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="NCQC" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '0.02em' }}>
            <span style={{ color: '#ef4444' }}>NCQC</span> Workspace
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="admin-menu-toggle"
            aria-label="Toggle menu"
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Dim Backdrop when Mobile Sidebar is open */}
      {isMobileMenuOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div>
            <h1><span>NCQC</span><br/>WORKSPACE</h1>
            <p>Content Management</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
            className="sidebar-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Active Administrator Identity Badge */}
        {user && (
          <div style={{
            margin: '0.75rem 1rem',
            padding: '0.75rem 0.9rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email.split('@')[0]}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out of Admin Workspace"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fca5a5',
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#fca5a5';
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        <nav className="admin-nav">
          <ul>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-btn">
            <span>←</span> Back to Website
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminProtectedShell>
        {children}
      </AdminProtectedShell>
    </AdminAuthProvider>
  );
}
