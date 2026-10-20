'use client';

import { useState, useEffect } from 'react';
import { getFirebaseForms } from '@/lib/firebaseForms';

interface CompetitionTimerProps {
  title?: string;
  eventDate?: string;
  dateStr?: string;
  rulesButtonText?: string;
  rulesLink?: string;
  submissionsButtonText?: string;
  registerLink?: string;
  competitionSlug?: string;
}

export default function CompetitionTimer({ 
  title = 'Submissions',
  eventDate = 'October 25, 2026',
  dateStr = 'October 25, 2026 at 12:00 AM',
  rulesButtonText = 'Download Rules & Regs',
  rulesLink = '#',
  submissionsButtonText,
  registerLink = '#',
  competitionSlug
}: CompetitionTimerProps) {
  const [attachedForm, setAttachedForm] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    isExpired: boolean;
  }>({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
    isExpired: false
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if custom form is linked in Firebase Cloud Database
    if (competitionSlug) {
      getFirebaseForms().then(forms => {
        if (forms && forms.length > 0) {
          const compDecoded = decodeURIComponent(competitionSlug).trim().toLowerCase();
          const match = forms.find((f: any) => {
            if (!f.competitionSlug) return false;
            const fDecoded = decodeURIComponent(f.competitionSlug).trim().toLowerCase();
            return fDecoded === compDecoded || f.competitionSlug === competitionSlug;
          });
          if (match && match.isActive) {
            setAttachedForm({ id: match.id, title: match.title, slug: match.slug });
          }
        }
      }).catch(e => {
        console.warn('Error reading attached form in CompetitionTimer:', e);
      });
    }

    const parseTargetDate = (str?: string): number => {
      if (!str) return new Date('2026-11-05T00:00:00').getTime();
      try {
        const cleaned = str.replace(/\bat\b/gi, ' ').replace(/\s+/g, ' ').trim();
        const parsed = new Date(cleaned).getTime();
        if (!isNaN(parsed)) return parsed;
      } catch {
        // fallback
      }
      try {
        const direct = new Date(str).getTime();
        if (!isNaN(direct)) return direct;
      } catch {
        // fallback
      }
      return new Date('2026-11-05T00:00:00').getTime();
    };

    const targetTime = parseTargetDate(dateStr);

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetTime - now;

      if (distance <= 0) {
        setTimeLeft({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
          isExpired: true
        });
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d < 10 ? `0${d}` : `${d}`,
        hours: h < 10 ? `0${h}` : `${h}`,
        minutes: m < 10 ? `0${m}` : `${m}`,
        seconds: s < 10 ? `0${s}` : `${s}`,
        isExpired: false
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dateStr]);

  return (
    <div className="comp-3d-card reveal-fade up delay-1 is-visible">
      {/* 3D Top Bevel Gradient Accent */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: timeLeft.isExpired 
            ? 'linear-gradient(90deg, #475569 0%, #dc2626 50%, #475569 100%)' 
            : 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #7f1d1d 100%)',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
        }} 
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.6rem' }}>
        <h3 style={{ 
          fontSize: '1.3rem', 
          fontWeight: 900, 
          color: '#0f172a', 
          margin: 0,
          fontFamily: 'var(--font-primary), sans-serif',
          letterSpacing: '-0.02em'
        }}>
          Competition Details
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: timeLeft.isExpired ? '#ef4444' : '#22c55e',
            boxShadow: timeLeft.isExpired ? '0 0 10px #ef4444' : '0 0 10px #22c55e'
          }} />
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: timeLeft.isExpired ? '#ef4444' : '#16a34a' 
          }}>
            {timeLeft.isExpired ? 'Closed' : 'Live'}
          </span>
        </div>
      </div>

      {/* Date & Deadline Rows (3D Inset Surface) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Date Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '0.85rem 1.1rem',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)'
        }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
            border: '1px solid #cbd5e1',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#b91c1c" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Event Date</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{eventDate || 'October 25, 2026'}</div>
          </div>
        </div>

        {/* Deadline Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '0.85rem 1.1rem',
          background: timeLeft.isExpired 
            ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' 
            : 'linear-gradient(180deg, #fff5f5 0%, #fef2f2 100%)',
          borderRadius: '16px',
          border: timeLeft.isExpired ? '1px solid #cbd5e1' : '1px solid #fecdd3',
          boxShadow: timeLeft.isExpired 
            ? '0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)' 
            : '0 2px 6px rgba(225, 29, 72, 0.04), inset 0 1px 0 rgba(255,255,255,1)'
        }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: timeLeft.isExpired 
              ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fecdd3 100%)', 
            border: timeLeft.isExpired ? '1px solid #94a3b8' : '1px solid #fca5a5',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={timeLeft.isExpired ? '#475569' : '#991b1b'} strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              color: timeLeft.isExpired ? '#64748b' : '#991b1b', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em' 
            }}>
              Submissions Deadline
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: timeLeft.isExpired ? '#475569' : '#0f172a' }}>
              {dateStr}
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Section with 3D Embossed Tray & Keycaps */}
      <div className="timer-3d-tray">
        <div style={{ 
          fontSize: '0.74rem', 
          fontWeight: 800, 
          color: timeLeft.isExpired ? '#dc2626' : '#475569', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ 
            width: '7px', 
            height: '7px', 
            borderRadius: '50%', 
            background: timeLeft.isExpired ? '#dc2626' : '#dc2626' 
          }} />
          {timeLeft.isExpired ? 'Submissions Officially Closed' : 'Submissions Close In'}
        </div>

        {/* 3D Digit Tiles (Keycaps) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem', width: '100%' }}>
          <div className="timer-3d-tile">
            <span style={{ 
              fontSize: 'clamp(1.5rem, 3.8vw, 1.9rem)', 
              fontFamily: 'var(--font-impact)', 
              color: timeLeft.isExpired ? '#64748b' : '#0f172a', 
              lineHeight: '1', 
              fontWeight: 900 
            }}>
              {isMounted ? timeLeft.days : '00'}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
              Days
            </span>
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#94a3b8', lineHeight: '1', marginTop: '-10px' }}>:</span>
          <div className="timer-3d-tile">
            <span style={{ 
              fontSize: 'clamp(1.5rem, 3.8vw, 1.9rem)', 
              fontFamily: 'var(--font-impact)', 
              color: timeLeft.isExpired ? '#64748b' : '#0f172a', 
              lineHeight: '1', 
              fontWeight: 900 
            }}>
              {isMounted ? timeLeft.hours : '00'}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
              Hrs
            </span>
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#94a3b8', lineHeight: '1', marginTop: '-10px' }}>:</span>
          <div className="timer-3d-tile">
            <span style={{ 
              fontSize: 'clamp(1.5rem, 3.8vw, 1.9rem)', 
              fontFamily: 'var(--font-impact)', 
              color: timeLeft.isExpired ? '#64748b' : '#0f172a', 
              lineHeight: '1', 
              fontWeight: 900 
            }}>
              {isMounted ? timeLeft.minutes : '00'}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
              Min
            </span>
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#94a3b8', lineHeight: '1', marginTop: '-10px' }}>:</span>
          <div className="timer-3d-tile">
            <span style={{ 
              fontSize: 'clamp(1.5rem, 3.8vw, 1.9rem)', 
              fontFamily: 'var(--font-impact)', 
              color: timeLeft.isExpired ? '#64748b' : '#991b1b', 
              lineHeight: '1', 
              fontWeight: 900 
            }}>
              {isMounted ? timeLeft.seconds : '00'}
            </span>
            <span style={{ 
              fontSize: '0.65rem', 
              color: timeLeft.isExpired ? '#64748b' : '#991b1b', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              marginTop: '0.4rem', 
              letterSpacing: '0.05em' 
            }}>
              Sec
            </span>
          </div>
        </div>

        {/* Beautiful English Closed Notice Banner inside Card */}
        {timeLeft.isExpired && (
          <div style={{
            marginTop: '1.15rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1.5px solid #fca5a5',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#991b1b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Submissions Closed
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginTop: '0.2rem', lineHeight: 1.4, fontWeight: 500 }}>
                The deadline for this competition has officially passed ({dateStr}). New registrations and submissions are no longer accepted.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%' }}>
        {/* Secondary: Download Rules & Regs (Always Accessible, Never Expired) */}
        <a 
          href={rulesLink} 
          target={rulesLink && rulesLink !== '#' && !rulesLink.startsWith('/') ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="btn-3d-secondary"
          onClick={(e) => {
            if (!rulesLink || rulesLink === '#') {
              e.preventDefault();
              alert('Rules and Regulations document will be available for download shortly.');
            }
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {rulesButtonText || 'Download Rules & Regs'}
        </a>

        {/* Section divider with 3D lines */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.4rem 0 0.1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0)' }} />
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 800, 
            color: '#94a3b8', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em' 
          }}>
            AVAILABLE FORMS
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #e2e8f0, transparent)' }} />
        </div>

        {/* Submissions Button: 
            Visible but strictly disabled/locked if expired, with English alert on click */}
        {attachedForm && !timeLeft.isExpired && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#15803d',
            background: '#dcfce7',
            border: '1px solid #86efac',
            padding: '0.35rem 0.8rem',
            borderRadius: '100px',
            margin: '0 auto',
            width: 'fit-content'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            Online Form Attached &amp; Live
          </div>
        )}

        {timeLeft.isExpired ? (
          <div 
            onClick={() => {
              alert(`⚠️ SUBMISSIONS CLOSED\n\nThe deadline for this competition ended on ${dateStr}.\nThe submission portal is no longer accepting submissions or registrations.`);
            }}
            style={{
              width: '100%',
              padding: '0.95rem 1.25rem',
              borderRadius: '14px',
              background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
              border: '1px solid #475569',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              color: '#cbd5e1',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              cursor: 'not-allowed',
              opacity: 0.92,
              userSelect: 'none',
              transition: 'all 0.2s'
            }}
            role="button"
            aria-disabled="true"
            title="Submissions are closed. The deadline has expired."
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Submissions Closed &bull; Deadline Ended</span>
          </div>
        ) : (
          (() => {
            const finalLink = attachedForm 
              ? `/competitions/${encodeURIComponent(competitionSlug || '')}/register`
              : registerLink;
            const isInternal = finalLink && finalLink.startsWith('/');
            const buttonLabel = attachedForm 
              ? (submissionsButtonText || `Register Online (${attachedForm.title}) →`) 
              : (submissionsButtonText || `${title} | Submissions →`);

            return (
              <a 
                href={finalLink} 
                target={!isInternal && finalLink && finalLink !== '#' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="btn-3d-primary"
                onClick={(e) => {
                  if (!finalLink || finalLink === '#') {
                    e.preventDefault();
                    alert('Registration portal is active! Redirecting to submission form.');
                  }
                }}
              >
                {buttonLabel}
              </a>
            );
          })()
        )}
      </div>
    </div>
  );
}
