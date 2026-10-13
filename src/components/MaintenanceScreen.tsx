'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MaintenanceScreenProps {
  notice?: string;
  estimatedEndTime?: string;
}

export default function MaintenanceScreen({
  notice = "The Nalanda College Quiz Club portal is currently undergoing scheduled maintenance to bring you an upgraded experience. We will be back online shortly.",
  estimatedEndTime = "Coming Soon"
}: MaintenanceScreenProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(ellipse at 50% 20%, #1a0509 0%, #080307 45%, #020204 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '2.5rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-primary), sans-serif'
    }}>
      {/* Ambient background glow orbs */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.22) 0%, rgba(220, 38, 38, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(50px)'
      }} />

      {/* Top Header / Branding */}
      <header style={{
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.6rem 1.4rem',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '100px',
        backdropFilter: 'blur(16px)'
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="NCQC Crest" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.12em', color: '#f87171', display: 'block', textTransform: 'uppercase' }}>
            Nalanda College Quiz Club
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
            Official Digital Society Portal
          </span>
        </div>
      </header>

      {/* Center Main Stage */}
      <main style={{
        zIndex: 10,
        maxWidth: '780px',
        width: '100%',
        textAlign: 'center',
        margin: 'auto 0',
        padding: '2rem 1rem'
      }}>
        {/* Pulsing Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          padding: '0.45rem 1.1rem',
          borderRadius: '100px',
          marginBottom: '2rem',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)'
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#ef4444',
            display: 'inline-block',
            boxShadow: '0 0 10px #ef4444'
          }} />
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: '#fca5a5',
            textTransform: 'uppercase'
          }}>
            Scheduled Maintenance in Progress
          </span>
        </div>

        {/* Big Bold Headline */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 6.5vw, 4.4rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          margin: '0 0 1.5rem 0',
          background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 75%, #64748b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-impact), sans-serif'
        }}>
          We’re Upgrading Our Platform
        </h1>

        {/* Message description */}
        <p style={{
          fontSize: 'clamp(0.95rem, 2.2vw, 1.22rem)',
          lineHeight: 1.65,
          color: '#cbd5e1',
          maxWidth: '640px',
          margin: '0 auto 2.5rem auto',
          fontWeight: 400
        }}>
          {notice}
        </p>

        {/* Glass Card Details (Time & ETA) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          maxWidth: '560px',
          margin: '0 auto 2.5rem auto'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.2rem',
            backdropFilter: 'blur(12px)'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
              System Clock (SLST)
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.05em' }}>
              {time || '--:--:--'}
            </span>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.2rem',
            backdropFilter: 'blur(12px)'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
              Estimated Resumption
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.02em' }}>
              {estimatedEndTime}
            </span>
          </div>
        </div>

        {/* What’s being worked on chips */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          {[
            '⚡ Performance Boost',
            '🔒 Database & Security Sync',
            '🏆 Competition Registrations',
            '✨ UI Enhancements'
          ].map((feature, i) => (
            <span key={i} style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              padding: '0.35rem 0.85rem',
              borderRadius: '100px'
            }}>
              {feature}
            </span>
          ))}
        </div>
      </main>

      {/* Footer & Secret Admin Entrance */}
      <footer style={{
        zIndex: 10,
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '1.5rem',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div>
          &copy; {new Date().getFullYear()} Nalanda College Quiz Club. All Rights Reserved.
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
          >
            Facebook
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}
          >
            Instagram
          </a>
          <Link
            href="/admin"
            style={{
              color: '#f87171',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '0.35rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}
          >
            <span>🔐</span> Admin Workspace
          </Link>
        </div>
      </footer>
    </div>
  );
}
