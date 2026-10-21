'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { competitionsData, Competition } from '@/data/competitions';
import { CompetitionForm, FormField } from '@/data/forms';
import { stripStyledText } from '@/utils/styledText';
import RenderStyledText from '@/components/RenderStyledText';
import DigitalPassCard from '@/components/DigitalPassCard';
import { getFirebaseForms, getFirebaseFormLinks, saveFirebaseSubmission } from '@/lib/firebaseForms';

export default function CompetitionRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug ? String(params.slug) : '';
  const slug = decodeURIComponent(rawSlug);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [form, setForm] = useState<CompetitionForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [teamMembersList, setTeamMembersList] = useState<Array<{ name: string; grade: string; contact: string; role: string }>>([
    { name: '', grade: '', contact: '', role: 'Team Leader' },
    { name: '', grade: '', contact: '', role: 'Member 2' },
    { name: '', grade: '', contact: '', role: 'Member 3' },
    { name: '', grade: '', contact: '', role: 'Member 4' }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Load competition and linked form
  useEffect(() => {
    if (!slug) return;

    // 1. Find competition
    const findComp = (list: Competition[]) => {
      const decodedTarget = slug.trim().toLowerCase();
      const slugifiedTarget = decodedTarget.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
      return list.find((c) => {
        const cDecoded = decodeURIComponent(c.slug || '').trim().toLowerCase();
        const cSlugified = cDecoded.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
        return cDecoded === decodedTarget || cSlugified === slugifiedTarget || c.slug === slug;
      });
    };

    let matchedComp = findComp(competitionsData);

    // Try fetching from API to get latest
    fetch('/api/competitions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const freshComp = findComp(data.data);
          if (freshComp) {
            setCompetition(freshComp);
            checkDeadline(freshComp.deadline || freshComp.date);
          }
        }
      })
      .catch(() => {});

    if (matchedComp) {
      setCompetition(matchedComp);
      checkDeadline(matchedComp.deadline || matchedComp.date);
    }

    const isFormMatchForComp = (f: CompetitionForm, targetSlug: string) => {
      const compSlugLower = targetSlug.trim().toLowerCase();
      const fCompSlug = (f.competitionSlug || '').trim().toLowerCase();
      const fSlug = (f.slug || '').trim().toLowerCase();
      const fId = (f.id || '').trim().toLowerCase();
      return (
        (fCompSlug && (fCompSlug === compSlugLower || fCompSlug === targetSlug)) ||
        fSlug === compSlugLower ||
        fId === compSlugLower ||
        (compSlugLower.length >= 4 && fSlug.includes(compSlugLower)) ||
        (fSlug.length >= 4 && compSlugLower.includes(fSlug))
      );
    };

    // 1b. Check client localStorage cache first
    try {
      const localFormsStr = localStorage.getItem('ncqc_competition_forms');
      if (localFormsStr) {
        const localForms: CompetitionForm[] = JSON.parse(localFormsStr);
        const localMatch = localForms.find(f => isFormMatchForComp(f, slug));
        if (localMatch && localMatch.isActive !== false) {
          setForm(localMatch);
        }
      }
    } catch {}

    // 2. Load linked form directly from Firebase Cloud Database
    getFirebaseForms().then(firebaseForms => {
      if (firebaseForms && firebaseForms.length > 0) {
        const matchedForm = firebaseForms.find(f => isFormMatchForComp(f, slug));

        if (matchedForm && matchedForm.isActive !== false) {
          setForm(matchedForm);
          return;
        }
      }
    }).catch(err => {
      console.warn('Error reading form from Firebase:', err);
    });

    // 3. Fallback form matching PIXELEON '26 (Image 2) if none linked yet
    const defaultForm: CompetitionForm = {
      id: 'default_form_' + Date.now(),
      slug: 'pixeleon-26-submissions',
      title: matchedComp ? `${stripStyledText(matchedComp.title)} | Registration` : "PIXELEON '26 | Submissions",
      description: matchedComp?.shortDesc 
        ? stripStyledText(matchedComp.shortDesc)
        : "Blend artistic vision with technical precision to craft visual masterpieces. Bring abstract concepts to life through composition, color, and typography.",
      scope: 'inter-school',
      category: 'Senior (Grade 10 - 13)',
      accentColor: '#dc2626',
      limitOneResponse: true,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      competitionSlug: slug,
      competitionTitle: matchedComp ? stripStyledText(matchedComp.title) : undefined,
      fields: [
        { id: 'f_email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', required: true, helpText: 'This form is limited to 1 response per email.' },
        { id: 'f_name', label: 'Name', type: 'text', placeholder: 'Enter your full name', required: true },
        { id: 'f_grade', label: 'Grade', type: 'text', placeholder: 'e.g. Grade 11', required: true },
        { id: 'f_school', label: 'School Name', type: 'text', placeholder: 'Enter school name', required: true },
        { id: 'f_cat', label: 'Category Selection', type: 'select', placeholder: 'Choose category...', required: true, options: ['Senior Category (Grade 10 - 13)', 'Junior Category (Grade 6 - 9)', 'Primary Category (Grade 3 - 5)', 'Open Category'] }
      ]
    };
    setForm(defaultForm);
  }, [slug]);

  const checkDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return;
    try {
      const cleaned = deadlineStr.replace(/\bat\b/gi, ' ').replace(/\s+/g, ' ').trim();
      const targetTime = new Date(cleaned).getTime();
      if (!isNaN(targetTime) && targetTime <= Date.now()) {
        setIsExpired(true);
      }
    } catch {}
  };

  // Synchronize team members count strictly with admin configuration
  useEffect(() => {
    if (!form) return;
    const teamField = form.fields.find(f => f.type === 'team-members');
    if (teamField) {
      const targetCount = teamField.teamConfig?.memberCount || 4;
      setTeamMembersList(prev => {
        if (prev.length === targetCount) return prev;
        return Array.from({ length: targetCount }).map((_, i) => ({
          name: prev[i]?.name || '',
          grade: prev[i]?.grade || '',
          contact: prev[i]?.contact || '',
          role: i === 0 ? 'Member 1 (Team Leader)' : `Member ${i + 1}`
        }));
      });
    }
  }, [form]);

  const handleInputChange = (fieldLabel: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldLabel]: value }));
    if (errors[fieldLabel]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldLabel];
        return copy;
      });
    }
  };

  const handleTeamMemberChange = (index: number, key: 'name' | 'grade' | 'contact', value: string) => {
    const updated = [...teamMembersList];
    updated[index] = { ...updated[index], [key]: value };
    setTeamMembersList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (isExpired) {
      alert('⚠️ Submissions for this competition have officially closed.');
      return;
    }

    // Validation
    const newErrors: Record<string, string> = {};
    form.fields.forEach(field => {
      if (field.type === 'team-members') {
        const targetCount = field.teamConfig?.memberCount || 4;
        const leader = teamMembersList[0];
        if (!leader?.name?.trim()) {
          newErrors[field.label] = 'Team Leader name is required.';
        } else if (field.teamConfig?.enforceExactCount) {
          const emptyIdx = teamMembersList.slice(0, targetCount).findIndex(m => !m.name.trim());
          if (emptyIdx !== -1) {
            newErrors[field.label] = `All ${targetCount} team members are strictly required. Please enter details for Member ${emptyIdx + 1}.`;
          }
        }
      } else {
        const val = formValues[field.label];
        if (field.required) {
          if (val === undefined || val === null || String(val).trim() === '') {
            newErrors[field.label] = `${field.label} is required.`;
          }
        }
        if (field.type === 'email' && val) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val).trim())) {
            newErrors[field.label] = 'Please enter a valid email address.';
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    // Generate distinct, high-entropy unique Referral / Registration ID (6 digits)
    const generatedRef = `REG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSubmission = {
      id: generatedRef,
      referralId: generatedRef,
      formId: form.id,
      formTitle: form.title,
      competitionSlug: slug,
      competitionTitle: competition ? stripStyledText(competition.title) : form.competitionTitle || 'NCQC Competition',
      scope: form.scope || 'inter-school',
      submittedAt: (() => {
        const now = new Date();
        const d = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
        const t = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        return `${d} ${t}`;
      })(),
      status: 'confirmed' as const,
      data: { 
        ...formValues,
        'Registration ID': generatedRef,
        ...(teamMembersList.some(m => m.name.trim()) ? {
          'Team Members': teamMembersList.filter(m => m.name.trim()).map(m => `${m.role}: ${m.name}${m.grade ? ` (${m.grade})` : ''}${m.contact ? ` [${m.contact}]` : ''}`).join('; ')
        } : {})
      },
      teamMembers: teamMembersList.filter(m => m.name.trim())
    };

    // Save submission directly to Firebase Cloud Database (Firestore)
    try {
      await saveFirebaseSubmission(newSubmission);
    } catch (err) {
      console.warn('Firebase save submission notice:', err);
    }

    setIsSubmitting(false);
    setSubmittedId(generatedRef);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleCopyId = () => {
    if (submittedId) {
      navigator.clipboard.writeText(submittedId);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  const accentColor = form?.accentColor || '#dc2626';
  const candidateName = formValues['School / Institution Name'] || formValues['Candidate Name'] || formValues['Name'] || teamMembersList[0]?.name || 'Registered Candidate';
  const schoolName = formValues['School Name'] || formValues['School / Institution Name'] || '';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '8.5rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <Link 
            href={`/competitions/${encodeURIComponent(slug)}`}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#475569', 
              fontWeight: 700, 
              fontSize: '0.9rem',
              textDecoration: 'none',
              background: '#ffffff',
              padding: '0.55rem 1.1rem',
              borderRadius: '100px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            &larr; Back to {competition ? stripStyledText(competition.title) : 'Competition Details'}
          </Link>

          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 800, 
            color: '#15803d', 
            background: '#dcfce7', 
            border: '1px solid #86efac', 
            padding: '0.35rem 0.85rem', 
            borderRadius: '100px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
            Official Submission Portal
          </span>
        </div>

        {/* Competition Context Header */}
        {competition && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '24px',
            padding: '2rem 2.25rem',
            color: '#ffffff',
            marginBottom: '2rem',
            boxShadow: '0 15px 35px rgba(15, 23, 42, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            flexWrap: 'wrap'
          }}>
            {competition.image && (
              <img 
                src={competition.image} 
                alt="Competition Banner" 
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '16px', 
                  objectFit: 'cover', 
                  border: '2px solid rgba(255,255,255,0.15)' 
                }} 
              />
            )}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(220, 38, 38, 0.25)', color: '#fca5a5', border: '1px solid rgba(220, 38, 38, 0.4)', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '100px', textTransform: 'uppercase' }}>
                  {form?.scope ? form.scope.replace('-', ' ') : 'Quiz Competition'}
                </span>
                {competition.eventDate && (
                  <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '100px' }}>
                    📅 {competition.eventDate}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 0.35rem 0', lineHeight: 1.25 }}>
                <RenderStyledText text={competition.title} />
              </h1>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {competition.shortDesc ? stripStyledText(competition.shortDesc) : 'Official registration form for Nalanda College Quiz Club.'}
              </p>
            </div>
          </div>
        )}

        {/* Expired Warning Banner */}
        {isExpired && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '18px',
            padding: '1.5rem',
            color: '#991b1b',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Submissions Are Closed</div>
              <div style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
                The deadline for this competition has expired. You cannot submit new registrations at this time.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUCCESS CONFIRMATION MODAL / CARD                                         */}
        {/* ========================================================================= */}
        {submittedId ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            padding: '3.5rem 2.5rem',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.08)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }} />

            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#dcfce7',
              border: '2px solid #86efac',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              margin: '0 auto 1.5rem'
            }}>
              ✓
            </div>

            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Registration Verified &bull; Nalanda College Quiz Club
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0 1rem 0', letterSpacing: '-0.02em' }}>
              Submission Successful!
            </h2>
            <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Your application has been logged into the NCQC registry. Please save your reference code below for verification at the registration desk.
            </p>

            {/* Reference Number Box */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '1.25rem 2rem',
              maxWidth: '420px',
              margin: '0 auto 2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Referral / Registration ID
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {submittedId}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  background: copiedNotice ? '#16a34a' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {copiedNotice ? '✓ Copied' : '📋 Copy ID'}
              </button>
            </div>

            {/* WhatsApp Group Join Button (If configured by admin) */}
            {form?.postSubmitConfig?.whatsappGroupLink && (
              <div style={{ marginBottom: '2rem' }}>
                <a
                  href={form.postSubmitConfig.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    padding: '0.95rem 2rem',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '1rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>💬</span>
                  {form.postSubmitConfig.whatsappGroupLabel || 'Join Official WhatsApp Group'} →
                </a>
                <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, marginTop: '0.4rem' }}>
                  Click to join the official updates &amp; contest announcements group
                </div>
              </div>
            )}


            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <Link
                href={`/competitions/${encodeURIComponent(slug)}`}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: '#ffffff',
                  padding: '0.9rem 2rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)'
                }}
              >
                Return to Competition Page →
              </Link>
              <Link
                href="/competitions"
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '0.9rem 2rem',
                  borderRadius: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.95rem'
                }}
              >
                All Competitions
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* THE LIVE IMAGE 2 REPLICA FORM                                             */
          /* ========================================================================= */
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            padding: '3rem 2.5rem',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.06), 0 0 1px 1px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top Accent Stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, #f97316 100%)` }} />

            {/* Google Forms Style Header Banner (Image 1) */}
            {form?.headerImage && (
              <div style={{
                width: 'calc(100% + 5rem)',
                margin: '-3rem -2.5rem 2.25rem -2.5rem',
                maxHeight: '260px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <img 
                  src={form.headerImage} 
                  alt={form.title} 
                  style={{ width: '100%', height: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }} 
                />
              </div>
            )}

            {/* Form Title & Description (Image 2 style) */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 0.85rem 0', lineHeight: 1.2 }}>
                {form?.title || 'Competition Registration'}
              </h2>
              <p style={{ color: '#475569', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                {form?.description || 'Please complete all required fields accurately.'}
              </p>
            </div>

            {/* Dynamic Interactive Fields */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.65rem' }}>
              {form?.fields.map((field) => {
                const isEmailBox = field.type === 'email';
                const isTeamField = field.type === 'team-members';
                const fieldError = errors[field.label];

                // 1. Team Members Field (Image 5)
                if (isTeamField) {
                  return (
                    <div 
                      key={field.id}
                      style={{
                        background: '#f8fafc',
                        border: '2px solid #e2e8f0',
                        borderRadius: '18px',
                        padding: '1.75rem',
                        marginTop: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                            👥 {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                          </label>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                            Add participating team members (e.g. 4 students representing the school).
                          </p>
                        </div>
                        <span
                          style={{
                            background: field.teamConfig?.enforceExactCount ? '#fef2f2' : '#f1f5f9',
                            color: field.teamConfig?.enforceExactCount ? '#b91c1c' : '#0f172a',
                            border: `1px solid ${field.teamConfig?.enforceExactCount ? '#fecaca' : '#cbd5e1'}`,
                            padding: '0.4rem 0.85rem',
                            borderRadius: '9999px',
                            fontWeight: 800,
                            fontSize: '0.78rem'
                          }}
                        >
                          {field.teamConfig?.enforceExactCount ? '🔒' : '👥'}{' '}
                          {field.teamConfig?.enforceExactCount 
                            ? `Strict Squad: Exactly ${field.teamConfig?.memberCount || 4} Members Required` 
                            : `Team Squad: Up to ${field.teamConfig?.memberCount || 4} Members`}
                        </span>
                      </div>

                      {fieldError && (
                        <div style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                          ⚠️ {fieldError}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {teamMembersList.slice(0, field.teamConfig?.memberCount || 4).map((member, mIdx) => (
                          <div 
                            key={mIdx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '14px',
                              padding: '1.15rem 1.25rem',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: mIdx === 0 ? '#dc2626' : '#334155' }}>
                                {mIdx === 0 ? '👑 Member 1 (Team Leader)' : `👤 Member ${mIdx + 1}`}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                Slot {mIdx + 1} of {field.teamConfig?.memberCount || 4}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                                  {mIdx === 0 
                                    ? 'Full Name (Team Leader) *' 
                                    : field.teamConfig?.enforceExactCount 
                                      ? `Full Name (Member ${mIdx + 1}) *` 
                                      : `Full Name (Member ${mIdx + 1} - Optional)`}
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Student Full Name"
                                  value={member.name}
                                  onChange={(e) => handleTeamMemberChange(mIdx, 'name', e.target.value)}
                                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                                  Grade / Class
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Grade 11"
                                  value={member.grade}
                                  onChange={(e) => handleTeamMemberChange(mIdx, 'grade', e.target.value)}
                                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                />
                              </div>

                              {mIdx === 0 && (
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                                    WhatsApp / Mobile *
                                  </label>
                                  <input
                                    type="tel"
                                    placeholder="+94 7X XXX XXXX"
                                    value={member.contact}
                                    onChange={(e) => handleTeamMemberChange(mIdx, 'contact', e.target.value)}
                                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // 1. Highlighted Pink Container for Email (Exact Image 2 replica)
                if (isEmailBox) {
                  return (
                    <div 
                      key={field.id}
                      style={{ 
                        background: '#fff8f8',
                        border: fieldError ? '2px solid #ef4444' : '1px solid #fecaca',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}
                    >
                      <label style={{ fontSize: '0.95rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>
                      <input
                        type="email"
                        disabled={isExpired}
                        placeholder={field.placeholder || 'you@example.com'}
                        value={formValues[field.label] || ''}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.95rem 1.15rem',
                          borderRadius: '12px',
                          border: fieldError ? '1px solid #ef4444' : '1px solid #fca5a5',
                          background: '#ffffff',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          outline: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: fieldError ? '#dc2626' : '#b91c1c', fontWeight: fieldError ? 700 : 500 }}>
                        {fieldError || field.helpText || 'This form is limited to 1 response per email.'}
                      </span>
                    </div>
                  );
                }

                // 2. Regular Inputs (Text, Number, Phone)
                return (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                      {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>

                    {['text', 'number', 'tel'].includes(field.type) && (
                      <input
                        type={field.type}
                        disabled={isExpired}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        value={formValues[field.label] || ''}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.95rem 1.15rem',
                          borderRadius: '12px',
                          border: fieldError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          fontSize: '0.95rem',
                          background: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      />
                    )}

                    {/* Textarea */}
                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        disabled={isExpired}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        value={formValues[field.label] || ''}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.95rem 1.15rem',
                          borderRadius: '12px',
                          border: fieldError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          fontSize: '0.95rem',
                          background: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      />
                    )}

                    {/* Select Dropdown */}
                    {field.type === 'select' && (
                      <div style={{ position: 'relative' }}>
                        <select
                          disabled={isExpired}
                          value={formValues[field.label] || ''}
                          onChange={(e) => handleInputChange(field.label, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.95rem 1.15rem',
                            borderRadius: '12px',
                            border: fieldError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            background: '#ffffff',
                            color: formValues[field.label] ? '#0f172a' : '#94a3b8',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">-- Choose Option --</option>
                          {(field.options && field.options.length > 0 ? field.options : ['Default Option']).map((opt, oi) => (
                            <option key={oi} value={opt} style={{ color: '#0f172a', fontWeight: 600 }}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Radio Options */}
                    {field.type === 'radio' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.4rem' }}>
                        {(field.options || ['Option 1', 'Option 2']).map((opt, oi) => (
                          <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.92rem', color: '#334155', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '10px', background: formValues[field.label] === opt ? '#eff6ff' : '#f8fafc', border: formValues[field.label] === opt ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }}>
                            <input
                              type="radio"
                              disabled={isExpired}
                              name={`rad_${field.id}`}
                              value={opt}
                              checked={formValues[field.label] === opt}
                              onChange={(e) => handleInputChange(field.label, e.target.value)}
                              style={{ accentColor: accentColor }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* File Upload Box */}
                    {field.type === 'file' && (
                      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '1.75rem', textAlign: 'center', background: '#f8fafc' }}>
                        <span style={{ fontSize: '1.85rem', display: 'block', marginBottom: '0.4rem' }}>📎</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                          Upload Document / Slip (PDF, JPG, PNG)
                        </div>
                        <input 
                          type="file" 
                          disabled={isExpired}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleInputChange(field.label, `${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
                          }} 
                          style={{ fontSize: '0.85rem' }} 
                        />
                        {formValues[field.label] && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>
                            ✓ Selected: {formValues[field.label]}
                          </div>
                        )}
                      </div>
                    )}

                    {fieldError && (
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#dc2626', fontWeight: 700, marginTop: '0.35rem' }}>
                        {fieldError}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isExpired}
                style={{
                  background: isExpired 
                    ? '#94a3b8' 
                    : `linear-gradient(135deg, ${form?.submitButtonColor || accentColor} 0%, ${form?.submitButtonGradientEnd || '#991b1b'} 100%)`,
                  color: form?.submitButtonTextColor || '#ffffff',
                  border: 'none',
                  padding: '1.15rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: isExpired ? 'not-allowed' : 'pointer',
                  marginTop: '1.25rem',
                  boxShadow: isExpired ? 'none' : `0 14px 28px -4px ${(form?.submitButtonColor || accentColor)}55`,
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  width: '100%'
                }}
              >
                {isSubmitting ? (
                  <>⏳ Submitting Application...</>
                ) : isExpired ? (
                  <>Submissions Closed</>
                ) : (
                  <>{form?.submitButtonText || '🚀 Submit Registration →'}</>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
