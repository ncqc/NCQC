'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FormSubmission } from '@/data/forms';
import { getFirebaseSubmissions } from '@/lib/firebaseForms';

export default function SubmissionsHubPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load submissions from Firebase Cloud Database on mount
  useEffect(() => {
    setIsLoading(true);
    getFirebaseSubmissions()
      .then((subs) => {
        if (subs && subs.length > 0) {
          setSubmissions(subs);
        } else {
          // Fallback to local storage if offline
          try {
            const localSubs = localStorage.getItem('ncqc_competition_submissions');
            if (localSubs) {
              setSubmissions(JSON.parse(localSubs));
            }
          } catch (e) {
            console.warn('Submissions fetch fallback error:', e);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch submissions:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Filter ONLY matches when search query is entered (Strict Privacy: Never reveal all records)
  const q = searchQuery.trim().toLowerCase();
  const qClean = q.replace(/[^a-z0-9]/gi, '');
  const qDigits = q.replace(/[^0-9]/g, '');

  const matchedSubmissions = !q ? [] : submissions.filter((sub) => {
    const subId = (sub.id || '').toLowerCase();
    const subRef = ((sub as any).referralId || '').toLowerCase();
    const idClean = subId.replace(/[^a-z0-9]/gi, '');
    const refClean = subRef.replace(/[^a-z0-9]/gi, '');

    // 1. Registration / Referral Code Match
    const isIdMatch = (
      subId.includes(q) ||
      subRef.includes(q) ||
      (qClean.length >= 3 && (idClean.includes(qClean) || refClean.includes(qClean)))
    );

    // 2. School Name Match
    const schoolName = (
      sub.data?.['School Name'] ||
      sub.data?.['School'] ||
      sub.data?.['School / Institution Name'] ||
      sub.data?.['Institute Name'] ||
      ''
    ).toLowerCase();

    const isSchoolMatch = qClean.length >= 2 && (
      schoolName.includes(q) ||
      (qClean.length >= 3 && schoolName.replace(/[^a-z0-9]/gi, '').includes(qClean))
    );

    // 3. Candidate / Team Leader Name Match
    const candidateName = (
      sub.data?.['Name'] ||
      sub.data?.['Full Name'] ||
      sub.data?.['Candidate Full Name'] ||
      sub.data?.['Team Leader Full Name'] ||
      ''
    ).toLowerCase();

    const isCandidateMatch = qClean.length >= 3 && (
      candidateName.includes(q) ||
      candidateName.replace(/[^a-z0-9]/gi, '').includes(qClean)
    );

    // 4. Phone number match
    let isPhoneMatch = false;
    if (qDigits.length >= 5) {
      for (const val of Object.values(sub.data || {})) {
        if (typeof val === 'string' || typeof val === 'number') {
          if (String(val).replace(/[^0-9]/g, '').includes(qDigits)) {
            isPhoneMatch = true;
            break;
          }
        }
      }
      if (!isPhoneMatch && sub.teamMembers) {
        for (const tm of sub.teamMembers) {
          if (tm.contact && tm.contact.replace(/[^0-9]/g, '').includes(qDigits)) {
            isPhoneMatch = true;
            break;
          }
        }
      }
    }

    const matchesQuery = isIdMatch || isSchoolMatch || isCandidateMatch || isPhoneMatch;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;

    return matchesQuery && matchesStatus;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleCopyCode = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper to extract team members
  const getTeamMembers = (sub: FormSubmission) => {
    if (Array.isArray(sub.teamMembers) && sub.teamMembers.length > 0) {
      return sub.teamMembers;
    }
    const teamData = sub.data?.['Participating Team Squad'] || sub.data?.['Team Members'] || sub.data?.['teamMembers'];
    if (Array.isArray(teamData)) return teamData;
    if (typeof teamData === 'string') {
      try {
        const parsed = JSON.parse(teamData);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  };

  // Printable Official Slip Generator
  const handlePrintSlip = (sub: FormSubmission) => {
    const printWin = window.open('', '_blank', 'width=850,height=920');
    if (!printWin) {
      alert('Please enable popups in your browser to print the registration slip.');
      return;
    }

    const members = getTeamMembers(sub);
    const fieldsHtml = Object.entries(sub.data || {})
      .filter(([k]) => !['Team Members', 'teamMembers', 'team_members', 'Referral ID', 'Participating Team Squad'].includes(k))
      .map(([k, v]) => `
        <div style="margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">
          <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">${k}</div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;margin-top:2px;">${String(v)}</div>
        </div>
      `).join('');

    const membersHtml = members.length > 0 ? `
      <div style="margin-top:20px;">
        <div style="font-size:13px;font-weight:900;color:#0f172a;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">
          👥 Official Participating Team Squad (${members.length} Members)
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f1f5f9;text-align:left;">
              <th style="padding:8px 10px;font-weight:800;color:#334155;">Role</th>
              <th style="padding:8px 10px;font-weight:800;color:#334155;">Full Name</th>
              <th style="padding:8px 10px;font-weight:800;color:#334155;">Grade</th>
              <th style="padding:8px 10px;font-weight:800;color:#334155;">Contact / WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((m: any, idx: number) => `
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:8px 10px;font-weight:900;color:${idx === 0 ? '#dc2626' : '#475569'};">${m.role || (idx === 0 ? 'Member 1 (Team Leader)' : `Member ${idx + 1}`)}</td>
                <td style="padding:8px 10px;font-weight:800;color:#0f172a;">${m.name || '-'}</td>
                <td style="padding:8px 10px;color:#64748b;font-weight:600;">${m.grade || '-'}</td>
                <td style="padding:8px 10px;color:#047857;font-weight:700;">${m.contact || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const statusBadge = sub.status === 'confirmed'
      ? '<span style="color:#15803d;background:#dcfce7;border:2px solid #86efac;padding:6px 14px;border-radius:8px;font-weight:900;font-size:14px;display:inline-block;">✓ CONFIRMED & APPROVED</span>'
      : sub.status === 'rejected'
        ? '<span style="color:#b91c1c;background:#fee2e2;border:2px solid #fca5a5;padding:6px 14px;border-radius:8px;font-weight:900;font-size:14px;display:inline-block;">✕ NOT APPROVED / REJECTED</span>'
        : '<span style="color:#b45309;background:#fef3c7;border:2px solid #fde047;padding:6px 14px;border-radius:8px;font-weight:900;font-size:14px;display:inline-block;">⏳ PENDING VERIFICATION</span>';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NCQC Registration Pass - ${sub.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 25px; }
            .slip-card { border: 2px solid #0f172a; border-radius: 16px; padding: 30px; position: relative; max-width: 780px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .header-strip { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .logo-title { font-size: 20px; font-weight: 900; color: #dc2626; letter-spacing: -0.02em; }
            .event-title { font-size: 13px; font-weight: 700; color: #475569; margin-top: 3px; }
            .id-box { background: #f8fafc; border: 2px dashed #0f172a; border-radius: 10px; padding: 12px 18px; text-align: center; }
            .id-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .id-val { font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: 0.05em; }
            .watermark { position: absolute; top: 48%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 72px; font-weight: 900; color: rgba(220, 38, 38, 0.04); pointer-events: none; z-index: 0; white-space: nowrap; }
            .footer { margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
            @media print {
              body { padding: 0; }
              .slip-card { border: 1.5px solid #000; box-shadow: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:center;margin-bottom:20px;">
            <button onclick="window.print()" style="background:#dc2626;color:#fff;border:none;padding:12px 28px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(220,38,38,0.4);">🖨️ Print / Save as PDF Pass</button>
          </div>
          <div class="slip-card">
            <div class="watermark">NALANDA QUIZ CLUB</div>
            <div class="header-strip">
              <div>
                <div class="logo-title">NALANDA COLLEGE QUIZ CLUB (NCQC)</div>
                <div class="event-title">${sub.formTitle || 'Official Tournament Registration'} &bull; ${sub.scope || 'All-Island'}</div>
              </div>
              <div class="id-box">
                <div class="id-label">Registration ID</div>
                <div class="id-val">${sub.referralId || sub.id}</div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;background:#f8fafc;padding:12px 16px;border-radius:10px;">
              <div>
                <span style="font-size:11px;font-weight:700;color:#64748b;">ENTRY STATUS:</span>
                <div style="margin-top:4px;">${statusBadge}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-size:11px;font-weight:700;color:#64748b;">SUBMITTED TIMESTAMP</span>
                <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:4px;">${sub.submittedAt || new Date().toISOString()}</div>
              </div>
            </div>
            <div>${fieldsHtml}</div>
            ${membersHtml}
            <div class="footer">
              <div>Official Verification Portal &bull; Nalanda College, Colombo 10</div>
              <div>Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #090d16 0%, #0f172a 50%, #090d16 100%)',
      minHeight: '100vh',
      color: '#f8fafc',
      paddingTop: '8rem',
      paddingBottom: '8rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 3D Animated Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '650px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.22) 0%, rgba(220, 38, 38, 0.03) 65%, transparent 80%)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        top: '40%',
        left: '10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease'
            }}
          >
            ← Home
          </Link>

          <Link
            href="/competitions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#f8fafc',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(153, 27, 27, 0.4) 100%)',
              padding: '0.5rem 1.15rem',
              borderRadius: '10px',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.2)'
            }}
          >
            🏆 Active Competitions
          </Link>
        </div>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            color: '#f87171',
            padding: '0.4rem 1.25rem',
            borderRadius: '100px',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
            boxShadow: '0 0 25px rgba(220, 38, 38, 0.25)'
          }}>
            <span>🏛️</span> Official Registration Tracking Portal
          </div>

          <h1 style={{
            fontSize: 'clamp(2.1rem, 5vw, 3.2rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            margin: '0 0 1rem 0',
            lineHeight: 1.15,
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Submissions Hub
          </h1>

          <p style={{
            color: '#94a3b8',
            fontSize: '1.05rem',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.65
          }}>
            Enter your official <strong style={{ color: '#f8fafc' }}>Registration ID code</strong> (e.g. <span style={{ fontFamily: 'monospace', color: '#f87171' }}>REG-2026-XXXXXX</span>) or registered <strong style={{ color: '#f8fafc' }}>School Name</strong> below to check real-time approval status and access your verified registration entry pass.
          </p>
        </div>

        {/* 3D Modern Search & Verification Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 0 30px rgba(220, 38, 38, 0.15)',
          backdropFilter: 'blur(20px)',
          marginBottom: '2.5rem'
        }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <span style={{
                position: 'absolute',
                left: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.25rem',
                color: '#64748b'
              }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHasSearched(true);
                }}
                placeholder="Enter Registration ID (REG-2026-XXXXXX), School Name, or Phone..."
                style={{
                  width: '100%',
                  padding: '1.05rem 1.25rem 1.05rem 3.25rem',
                  borderRadius: '16px',
                  background: 'rgba(2, 6, 23, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.82rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '1.05rem 2rem',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <span>Verify Status</span>
              <span>→</span>
            </button>
          </form>

          {/* Quick Filter Badges */}
          {matchedSubmissions.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>Filter Status:</span>
              {[
                { id: 'all', label: 'All Matching' },
                { id: 'confirmed', label: '✓ Confirmed Only' },
                { id: 'pending', label: '⏳ Pending Only' },
                { id: 'rejected', label: '✕ Rejected Only' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    background: filterStatus === f.id ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: filterStatus === f.id ? '#fca5a5' : '#94a3b8',
                    border: filterStatus === f.id ? '1px solid #dc2626' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Display Area */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8' }}>
            <div style={{
              width: '45px',
              height: '45px',
              border: '3px solid rgba(220, 38, 38, 0.2)',
              borderTopColor: '#dc2626',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Connecting to NCQC Cloud Database...</div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0' }}>Syncing latest tournament registrations</p>
          </div>
        ) : !q ? (
          /* ========================================================================= */
          /* INITIAL STATE: PRIVACY PROTECTED NOTICE (No submissions listed publicly)  */
          /* ========================================================================= */
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.05) 100%)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 35px rgba(220, 38, 38, 0.2)'
            }}>
              🔒
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.85rem 0' }}>
              Realtime Privacy Protected Verification
            </h3>

            <p style={{ color: '#94a3b8', fontSize: '0.98rem', maxWidth: '620px', margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
              To ensure participant privacy, school registrations are confidential and are never listed in public tables. Type your <strong style={{ color: '#f8fafc' }}>Registration ID</strong> code or <strong style={{ color: '#f8fafc' }}>School Name</strong> in the search bar above to securely reveal your entry.
            </p>

            {/* Step-by-Step Guidance */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              textAlign: 'left'
            }}>
              <div style={{
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '1.5rem',
                borderRadius: '16px'
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>1️⃣</div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.35rem' }}>Find Your Code</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  Retrieve the Referral ID code (e.g. REG-2026-XXXXXX) received upon completing registration.
                </div>
              </div>

              <div style={{
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '1.5rem',
                borderRadius: '16px'
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>2️⃣</div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.35rem' }}>Search Your School</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  Type your Registration ID or School Name into the search box above to isolate your record.
                </div>
              </div>

              <div style={{
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '1.5rem',
                borderRadius: '16px'
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>3️⃣</div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.35rem' }}>Check Approval & Print</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  View real-time approval status and print your official NCQC tournament participation slip.
                </div>
              </div>
            </div>
          </div>
        ) : matchedSubmissions.length === 0 ? (
          /* ========================================================================= */
          /* NO MATCH FOUND ALERT                                                      */
          /* ========================================================================= */
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              margin: '0 auto 1.25rem'
            }}>
              🔍
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
              No Matching Registration Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
              We could not find an official entry matching <span style={{ color: '#f87171', fontWeight: 800 }}>"{searchQuery}"</span>. Please double-check for typing errors in your Registration ID or School Name.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Clear Search
              </button>
              <Link
                href="/contact"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
                }}
              >
                Contact NCQC Committee
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MATCHED ENTRIES: STRICT PRIVACY (Shows ONLY matching records)              */
          /* ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0 0.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Isolated Verified Results
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0 0' }}>
                  Found {matchedSubmissions.length} Verified {matchedSubmissions.length === 1 ? 'Record' : 'Records'}
                </h2>
              </div>
              <span style={{
                fontSize: '0.78rem',
                color: '#94a3b8',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.35rem 0.85rem',
                borderRadius: '100px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                🔒 Restricted to: "{searchQuery}"
              </span>
            </div>

            {matchedSubmissions.map((sub) => {
              const members = getTeamMembers(sub);
              const school = sub.data?.['School Name'] || sub.data?.['School'] || sub.data?.['School / Institution Name'] || 'Nalanda College';
              const candidate = sub.data?.['Name'] || sub.data?.['Candidate Full Name'] || sub.data?.['Team Leader Full Name'] || 'Registered Candidate';
              const refId = sub.referralId || sub.id;

              const isConfirmed = sub.status === 'confirmed';
              const isRejected = sub.status === 'rejected';
              const isPending = !isConfirmed && !isRejected;

              return (
                <div
                  key={sub.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: isConfirmed ? '1px solid rgba(34, 197, 94, 0.4)' : isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    boxShadow: isConfirmed 
                      ? '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(34, 197, 94, 0.15)'
                      : isRejected
                        ? '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(239, 68, 68, 0.15)'
                        : '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.15)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Glowing Top Accent Bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: isConfirmed 
                      ? 'linear-gradient(90deg, #16a34a 0%, #4ade80 100%)' 
                      : isRejected
                        ? 'linear-gradient(90deg, #dc2626 0%, #f87171 100%)'
                        : 'linear-gradient(90deg, #d97706 0%, #fbbf24 100%)'
                  }} />

                  {/* Top Header Card */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.75rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '1.5rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(220, 38, 38, 0.15)',
                          border: '1px solid rgba(220, 38, 38, 0.35)',
                          color: '#f87171',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {sub.scope || 'Tournament Entry'}
                        </span>
                        {sub.category && (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#cbd5e1',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {sub.category}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0 0.5rem 0', lineHeight: 1.25 }}>
                        {sub.formTitle || sub.competitionTitle || 'Official Competition Registration'}
                      </h3>
                      <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                        Submitted on: <strong style={{ color: '#e2e8f0' }}>{sub.submittedAt || 'Confirmed in Database'}</strong>
                      </div>
                    </div>

                    {/* Official 3D Status Badge (Confirmed / Pending / Rejected) */}
                    <div>
                      {isConfirmed ? (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.25) 0%, rgba(34, 197, 94, 0.15) 100%)',
                          border: '2px solid #22c55e',
                          color: '#4ade80',
                          padding: '0.65rem 1.35rem',
                          borderRadius: '14px',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 0 25px rgba(34, 197, 94, 0.35)'
                        }}>
                          <span>✅</span> APPROVED & CONFIRMED
                        </div>
                      ) : isRejected ? (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%)',
                          border: '2px solid #ef4444',
                          color: '#f87171',
                          padding: '0.65rem 1.35rem',
                          borderRadius: '14px',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)'
                        }}>
                          <span>❌</span> NOT APPROVED / REJECTED
                        </div>
                      ) : (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
                          border: '2px solid #f59e0b',
                          color: '#fcd34d',
                          padding: '0.65rem 1.35rem',
                          borderRadius: '14px',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)'
                        }}>
                          <span>⏳</span> UNDER REVIEW / PENDING
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Code Banner */}
                  <div style={{
                    background: 'rgba(2, 6, 23, 0.75)',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Official Registration / Referral ID
                      </span>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: '#f8fafc',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                        marginTop: '0.2rem'
                      }}>
                        {refId}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(refId)}
                      style={{
                        background: copiedId === refId ? '#16a34a' : 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copiedId === refId ? '✓ Copied to Clipboard' : '📋 Copy ID Code'}
                    </button>
                  </div>

                  {/* Core Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>🏫 Registered Institution</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginTop: '0.35rem' }}>{school}</div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>👤 Candidate / Representative</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginTop: '0.35rem' }}>{candidate}</div>
                    </div>
                  </div>

                  {/* Team Squad Members Section */}
                  {members.length > 0 && (
                    <div style={{
                      background: 'rgba(2, 6, 23, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>👥</span> Participating Team Squad ({members.length} Members)
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified Roster</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                        {members.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              background: idx === 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                              border: idx === 0 ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                              padding: '1rem',
                              borderRadius: '12px'
                            }}
                          >
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: idx === 0 ? '#f87171' : '#94a3b8',
                              textTransform: 'uppercase'
                            }}>
                              {m.role || (idx === 0 ? 'Member 1 (Team Leader)' : `Member ${idx + 1}`)}
                            </span>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                              {m.name || 'Student Name'}
                            </div>
                            {m.grade && (
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                Grade / Class: {m.grade}
                              </div>
                            )}
                            {m.contact && (
                              <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700, marginTop: '0.2rem' }}>
                                📞 {m.contact}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submitted Data Fields Breakdown */}
                  <details style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '1rem 1.25rem',
                    marginBottom: '2rem',
                    cursor: 'pointer'
                  }}>
                    <summary style={{ fontWeight: 800, color: '#cbd5e1', fontSize: '0.88rem' }}>
                      📋 View Full Form Responses & Submitted Answers
                    </summary>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '1rem',
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      {Object.entries(sub.data || {})
                        .filter(([k]) => !['Team Members', 'teamMembers', 'team_members', 'Referral ID', 'Participating Team Squad'].includes(k))
                        .map(([k, v]) => (
                          <div key={k} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.65rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>{String(v)}</div>
                          </div>
                        ))}
                    </div>
                  </details>

                  {/* Action Bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <button
                      type="button"
                      onClick={() => handlePrintSlip(sub)}
                      style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem 1.75rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <span>🖨️</span> Print / Save Registration Pass
                    </button>

                    <Link
                      href="/contact"
                      style={{
                        color: '#94a3b8',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>💬</span> Need help? Contact NCQC Support →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
