'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import './admin.css'; // Import the premium custom CSS

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { name: 'Projects', path: '/admin/projects', icon: '🚀' },
    { name: 'Gallery', path: '/admin/gallery', icon: '📸' },
  ];

  return (
    <div className="admin-wrapper">
      {/* Mobile Header with Logo */}
      <div className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="NCQC" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '0.02em' }}>
            <span style={{ color: '#ef4444' }}>NCQC</span> Workspace
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="admin-menu-toggle"
          aria-label="Toggle menu"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
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
