'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface DigitalPassProps {
  submissionId: string;
  candidateName: string;
  schoolName?: string;
  competitionTitle: string;
  category?: string;
  scope?: string;
  submittedAt?: string;
  teamMembers?: Array<{ name: string; grade?: string; role?: string; contact?: string }>;
  accentColor?: string;
}

export default function DigitalPassCard({
  submissionId,
  candidateName,
  schoolName,
  competitionTitle,
  category = 'Senior Category',
  scope = 'Inter-School',
  submittedAt,
  teamMembers,
  accentColor = '#dc2626'
}: DigitalPassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Verification URL that will be encoded in the QR code
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${encodeURIComponent(submissionId)}`
    : `https://ncquizclub.com/verify/${encodeURIComponent(submissionId)}`;

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.warn('QR code gen error:', err));
  }, [verificationUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      
      {/* ========================================================================= */}
      {/* 3D DIGITAL VERIFICATION PASS CARD (EXACT IMAGE 3 REPLICA STYLING)         */}
      {/* ========================================================================= */}
      <div 
        id="ncqc-digital-pass-card"
        style={{
          width: '100%',
          borderRadius: '26px',
          background: 'linear-gradient(150deg, #0b1e42 0%, #102a6b 40%, #1e3a8a 70%, #312e81 100%)',
          color: '#ffffff',
          padding: '2.5rem 2rem 2.25rem',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-25%',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-20%',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Top Header: Nalanda College Quiz Club Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <img 
            src="/logo.png" 
            alt="NCQC Official Crest" 
            style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} 
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.15 }}>
              Nalanda College
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Quiz Club &bull; Official Pass
            </div>
          </div>
        </div>

        {/* Candidate / School / Title */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <h2 style={{ 
            fontSize: '1.65rem', 
            fontWeight: 900, 
            margin: '0 0 0.35rem 0', 
            letterSpacing: '0.02em', 
            textTransform: 'uppercase',
            color: '#ffffff',
            lineHeight: 1.2
          }}>
            {candidateName || 'Candidate Name'}
          </h2>
          
          {schoolName && (
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              {schoolName}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              color: '#ffffff', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '0.25rem 0.75rem', 
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.25)',
              textTransform: 'uppercase'
            }}>
              {scope}
            </span>
            <span style={{ 
              background: 'rgba(147, 51, 234, 0.3)', 
              color: '#e9d5ff', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '0.25rem 0.75rem', 
              borderRadius: '100px',
              border: '1px solid rgba(168, 85, 247, 0.4)'
            }}>
              {category}
            </span>
          </div>
        </div>

        {/* Center: The QR Code Box (Image 3 Style) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '1.25rem',
          maxWidth: '220px',
          margin: '0 auto 1.5rem',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.35)',
          border: '3px solid rgba(255, 255, 255, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Scan to Verify Pass" 
              style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }} 
            />
          ) : (
            <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 800 }}>
              Generating QR...
            </div>
          )}
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Scan to Verify Pass
          </span>
        </div>

        {/* Registration ID & Verification Token */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Official Reference ID
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.08em', color: '#ffffff', marginTop: '0.15rem' }}>
            {submissionId}
          </div>
          {submittedAt && (
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              Issued: {submittedAt}
            </div>
          )}
        </div>

        {/* Team Members List (If Applicable) */}
        {teamMembers && teamMembers.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Registered Team Squad ({teamMembers.length} Members)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {teamMembers.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#f1f5f9' }}>
                  <span>{idx === 0 ? '👑' : '•'} <strong>{m.name}</strong> {m.role ? `(${m.role})` : ''}</span>
                  {m.grade && <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>{m.grade}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Chip */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(34, 197, 94, 0.2)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          padding: '0.4rem 1rem',
          borderRadius: '100px',
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          Verified Entry Pass &bull; Active
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL CONTACT CARD (EXACT IMAGE 4 REPLICA)                             */}
      {/* ========================================================================= */}
      <div style={{
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem 1.75rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Red accent line on left (Exact Image 4 style) */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '5px', background: '#dc2626' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <span style={{ 
            background: '#fee2e2', 
            color: '#dc2626', 
            fontSize: '0.72rem', 
            fontWeight: 900, 
            padding: '0.25rem 0.85rem', 
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            PRESIDENT
          </span>
          <small style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Official Inquiries</small>
        </div>

        <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0' }}>
          Kemitha Randinu
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Phone */}
          <a 
            href="tel:+94723648022" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.65rem', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              padding: '0.75rem 1rem', 
              borderRadius: '12px',
              color: '#1e293b', 
              fontWeight: 700, 
              fontSize: '0.88rem',
              textDecoration: 'none'
            }}
          >
            <span style={{ color: '#dc2626', fontSize: '1rem' }}>📞</span>
            +94 72 3648 022
          </a>

          {/* Email */}
          <a 
            href="mailto:Kemitharandinu@gmail.com" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.65rem', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              padding: '0.75rem 1rem', 
              borderRadius: '12px',
              color: '#1e293b', 
              fontWeight: 700, 
              fontSize: '0.88rem',
              textDecoration: 'none'
            }}
          >
            <span style={{ color: '#dc2626', fontSize: '1rem' }}>✉️</span>
            Kemitharandinu@gmail.com
          </a>
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', gap: '0.65rem', width: '100%', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handlePrint}
          style={{
            flex: 1,
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
          }}
        >
          <span>🖨️</span> Print / Save Pass
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            background: copiedLink ? '#16a34a' : '#ffffff',
            color: copiedLink ? '#ffffff' : '#334155',
            border: '1px solid #cbd5e1',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <span>{copiedLink ? '✓' : '🔗'}</span> {copiedLink ? 'Link Copied!' : 'Copy Verification Link'}
        </button>
      </div>
    </div>
  );
}
