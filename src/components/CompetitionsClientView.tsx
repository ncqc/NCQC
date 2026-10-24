'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Competition } from '@/data/competitions';
import RenderStyledText from '@/components/RenderStyledText';
import { stripStyledText } from '@/utils/styledText';

interface CompetitionsClientViewProps {
  initialCompetitions: Competition[];
}

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

function formatCountdown(msDiff: number): string {
  if (msDiff <= 0) return '00:00:00';
  const days = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msDiff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export default function CompetitionsClientView({ initialCompetitions }: CompetitionsClientViewProps) {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'past'>('ongoing');
  const [now, setNow] = useState<number>(Date.now());

  // Real-time tick every second
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Categorize competitions dynamically based on real-time clock
  const { upcomingList, ongoingList, pastList } = useMemo(() => {
    const upcoming: Competition[] = [];
    const ongoing: Competition[] = [];
    const past: Competition[] = [];

    for (const comp of competitions) {
      const deadlineMs = parseDateToMs(comp.deadline);
      const startMs = parseDateToMs(comp.startDate || comp.eventDate || comp.date);

      // 1. Deadline passed -> Past
      if (deadlineMs !== null && now >= deadlineMs) {
        past.push(comp);
      }
      // 2. Start date in the future -> Upcoming
      else if (startMs !== null && now < startMs) {
        upcoming.push(comp);
      }
      // 3. Start date has arrived, deadline in future (or no deadline) -> Ongoing
      else {
        ongoing.push(comp);
      }
    }

    return { upcomingList: upcoming, ongoingList: ongoing, pastList: past };
  }, [competitions, now]);

  // Current active list
  const activeCompetitions = useMemo(() => {
    if (activeTab === 'ongoing') return ongoingList;
    if (activeTab === 'upcoming') return upcomingList;
    return pastList;
  }, [activeTab, upcomingList, ongoingList, pastList]);

  return (
    <div className="competitions-view-container" style={{ width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
      {/* 3 Centered Filter Buttons (Ongoing First, then Upcoming, then Past) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.9rem',
        flexWrap: 'wrap',
        marginBottom: '2.5rem'
      }}>
        {/* Button 1: Ongoing Battles */}
        <button
          onClick={() => setActiveTab('ongoing')}
          style={{
            background: activeTab === 'ongoing' 
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
              : '#ffffff',
            color: activeTab === 'ongoing' ? '#ffffff' : '#1e293b',
            border: activeTab === 'ongoing' ? 'none' : '1.5px solid #e2e8f0',
            borderRadius: '50px',
            padding: '0.75rem 1.45rem',
            fontSize: '0.94rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: activeTab === 'ongoing' 
              ? '0 8px 24px rgba(5, 150, 105, 0.35)' 
              : '0 4px 15px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.25s ease'
          }}
        >
          <span style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: activeTab === 'ongoing' ? '#34d399' : '#10b981',
            boxShadow: '0 0 10px #10b981',
            display: 'inline-block'
          }}></span>
          <span>Ongoing Battles</span>
          <span style={{
            background: activeTab === 'ongoing' ? 'rgba(255, 255, 255, 0.25)' : '#d1fae5',
            color: activeTab === 'ongoing' ? '#ffffff' : '#065f46',
            padding: '0.12rem 0.55rem',
            borderRadius: '100px',
            fontSize: '0.78rem',
            fontWeight: 800
          }}>
            {ongoingList.length}
          </span>
        </button>

        {/* Button 2: Upcoming Competitions */}
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            background: activeTab === 'upcoming' 
              ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' 
              : '#ffffff',
            color: activeTab === 'upcoming' ? '#ffffff' : '#1e293b',
            border: activeTab === 'upcoming' ? 'none' : '1.5px solid #e2e8f0',
            borderRadius: '50px',
            padding: '0.75rem 1.45rem',
            fontSize: '0.94rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: activeTab === 'upcoming' 
              ? '0 8px 24px rgba(124, 58, 237, 0.35)' 
              : '0 4px 15px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.25s ease'
          }}
        >
          <span style={{ fontSize: '1.05rem' }}>⏳</span>
          <span>Upcoming Competitions</span>
          <span style={{
            background: activeTab === 'upcoming' ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
            color: activeTab === 'upcoming' ? '#ffffff' : '#475569',
            padding: '0.12rem 0.55rem',
            borderRadius: '100px',
            fontSize: '0.78rem',
            fontWeight: 800
          }}>
            {upcomingList.length}
          </span>
        </button>

        {/* Button 3: Past Competitions */}
        <button
          onClick={() => setActiveTab('past')}
          style={{
            background: activeTab === 'past' 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : '#ffffff',
            color: activeTab === 'past' ? '#ffffff' : '#1e293b',
            border: activeTab === 'past' ? 'none' : '1.5px solid #e2e8f0',
            borderRadius: '50px',
            padding: '0.75rem 1.45rem',
            fontSize: '0.94rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: activeTab === 'past' 
              ? '0 8px 24px rgba(15, 23, 42, 0.35)' 
              : '0 4px 15px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.25s ease'
          }}
        >
          <span style={{ fontSize: '1.05rem' }}>🏆</span>
          <span>Past Competitions</span>
          <span style={{
            background: activeTab === 'past' ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9',
            color: activeTab === 'past' ? '#ffffff' : '#475569',
            padding: '0.12rem 0.55rem',
            borderRadius: '100px',
            fontSize: '0.78rem',
            fontWeight: 800
          }}>
            {pastList.length}
          </span>
        </button>
      </div>

      {/* Competitions Grid (Dynamically centered: 1 card -> center, 2 cards -> center, 3+ -> 3 columns) */}
      <style>{`
        .competitions-cards-row {
          display: grid !important;
          gap: 2rem 1.6rem !important;
          width: 100% !important;
          margin-bottom: 4rem !important;
          justify-content: center !important;
        }
        .competitions-cards-row .comp-card {
          width: 100% !important;
          max-width: 100% !important;
          flex: none !important;
          margin: 0 !important;
        }

        /* 1 Card: Centered horizontally in the middle of page */
        .competitions-cards-row.items-count-1 {
          grid-template-columns: minmax(280px, 420px) !important;
        }

        /* 2 Cards: Both centered side-by-side in the middle of page */
        .competitions-cards-row.items-count-2 {
          grid-template-columns: repeat(2, minmax(280px, 420px)) !important;
        }

        /* 3 or more Cards: 3 columns across */
        .competitions-cards-row.items-count-3plus {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        @media (max-width: 960px) {
          .competitions-cards-row.items-count-3plus {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          .competitions-cards-row,
          .competitions-cards-row.items-count-1,
          .competitions-cards-row.items-count-2,
          .competitions-cards-row.items-count-3plus {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>

      {activeCompetitions.length > 0 ? (
        <div
          className={`competitions-cards-row ${
            activeCompetitions.length === 1
              ? 'items-count-1'
              : activeCompetitions.length === 2
              ? 'items-count-2'
              : 'items-count-3plus'
          }`}
          style={{
            display: 'grid',
            gap: '2rem 1.6rem',
            width: '100%',
            marginBottom: '4rem',
            justifyContent: 'center',
            ...(activeCompetitions.length === 1
              ? { gridTemplateColumns: 'minmax(280px, 420px)' }
              : activeCompetitions.length === 2
              ? { gridTemplateColumns: 'repeat(2, minmax(280px, 420px))' }
              : { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' })
          }}
        >
          {activeCompetitions.map((competition) => {
            const startMs = parseDateToMs(competition.startDate || competition.eventDate || competition.date);
            const deadlineMs = parseDateToMs(competition.deadline);

            const isPast = deadlineMs !== null && now >= deadlineMs;
            const isUpcoming = !isPast && startMs !== null && now < startMs;
            const isOngoing = !isPast && !isUpcoming;

            const timeUntilStart = startMs && startMs > now ? startMs - now : 0;
            const timeUntilDeadline = deadlineMs && deadlineMs > now ? deadlineMs - now : 0;

            return (
              <div key={competition.slug} className="comp-card reveal-fade up is-visible" style={{ position: 'relative' }}>
                {/* Floating Status Tag */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 10,
                  borderRadius: '20px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  background: isUpcoming 
                    ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' 
                    : isOngoing 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  color: '#ffffff'
                }}>
                  <span>{isUpcoming ? '⏳ Upcoming' : isOngoing ? '🟢 Ongoing' : '🏁 Concluded'}</span>
                </div>

                <div className="comp-img-wrapper" style={{ height: '380px' }}>
                  <img src={competition.image || '/comp1.jpg'} alt={stripStyledText(competition.title)} className="comp-img" onError={(e) => (e.currentTarget.src = '/comp1.jpg')} />
                </div>

                <div className="comp-info" style={{ padding: '1.6rem 1.4rem 1.8rem 1.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                  <h3 className="comp-title" style={{ fontSize: '1.28rem', margin: 0, textAlign: 'center', lineHeight: 1.35, fontWeight: 900 }}>
                    <RenderStyledText text={competition.title} />
                  </h3>

                  {/* Dates & Countdown Banner */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                    {isUpcoming && (
                      <>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.82rem',
                          color: '#6d28d9',
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          padding: '0.3rem 0.85rem',
                          borderRadius: '100px',
                          fontWeight: 700
                        }}>
                          <span>🗓️ Starts:</span>
                          <span>{competition.startDate || competition.eventDate || competition.date}</span>
                        </div>
                        {timeUntilStart > 0 && (
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#7c3aed',
                            background: '#faf5ff',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <span>⏳ Starts in:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{formatCountdown(timeUntilStart)}</span>
                          </div>
                        )}
                      </>
                    )}

                    {isOngoing && (
                      <>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.82rem',
                          color: '#065f46',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '0.3rem 0.85rem',
                          borderRadius: '100px',
                          fontWeight: 700
                        }}>
                          <span>⏰ Deadline:</span>
                          <span>{competition.deadline || 'Submissions Open'}</span>
                        </div>
                        {timeUntilDeadline > 0 && (
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#b91c1c',
                            background: '#fff1f2',
                            border: '1px solid #fecdd3',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <span>⏱️ Remaining:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{formatCountdown(timeUntilDeadline)}</span>
                          </div>
                        )}
                      </>
                    )}

                    {isPast && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        color: '#64748b',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '0.3rem 0.85rem',
                        borderRadius: '100px',
                        fontWeight: 700
                      }}>
                        <span>🏁 Concluded on:</span>
                        <span>{competition.deadline || competition.eventDate || competition.date}</span>
                      </div>
                    )}
                  </div>

                  {/* Short Description */}
                  {competition.shortDesc && (
                    <p style={{
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      color: '#64748b',
                      margin: '0.25rem 0 0.5rem 0',
                      textAlign: 'center',
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      <RenderStyledText text={competition.shortDesc} />
                    </p>
                  )}

                  <Link 
                    href={`/competitions/${encodeURIComponent((competition.slug || '').trim())}`} 
                    prefetch={true} 
                    className="comp-btn-modern" 
                    style={{ marginTop: 'auto', fontSize: '0.92rem', width: '100%', textAlign: 'center' }}
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '4.5rem 2rem',
          background: '#ffffff',
          borderRadius: '24px',
          border: '2px dashed #e2e8f0',
          maxWidth: '680px',
          margin: '2rem auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ fontSize: '3.2rem', marginBottom: '0.85rem' }}>
            {activeTab === 'upcoming' ? '⏳' : activeTab === 'ongoing' ? '⚡' : '🏆'}
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
            {activeTab === 'upcoming' 
              ? 'No Upcoming Competitions' 
              : activeTab === 'ongoing' 
                ? 'No Ongoing Battles Right Now' 
                : 'No Past Competitions Found'}
          </h3>

          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '460px', margin: '0 auto 1.5rem auto', lineHeight: 1.55 }}>
            {activeTab === 'upcoming' 
              ? 'Stay tuned! New tournament announcements and guidelines will be scheduled here soon.'
              : activeTab === 'ongoing' 
                ? 'Currently, there are no live competitions accepting submissions. Check the Upcoming tab for future tournaments!'
                : 'Past competition archives and results will appear here once competitions conclude.'}
          </p>

          {activeTab !== 'upcoming' && upcomingList.length > 0 ? (
            <button
              onClick={() => setActiveTab('upcoming')}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.6rem',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)'
              }}
            >
              Explore Upcoming Competitions ({upcomingList.length}) →
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
