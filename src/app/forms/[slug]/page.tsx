'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CompetitionForm, FormField } from '@/data/forms';
import { getFirebaseForms, saveFirebaseSubmission } from '@/lib/firebaseForms';

export default function StandalonePublicFormPage() {
  const params = useParams();
  const rawSlug = params?.slug ? String(params.slug) : '';
  const slug = decodeURIComponent(rawSlug);

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

  useEffect(() => {
    if (!slug) return;

    // Load directly from Firebase Database (Real Cloud)
    getFirebaseForms().then(firebaseForms => {
      if (firebaseForms && firebaseForms.length > 0) {
        const match = firebaseForms.find(f => f.slug.toLowerCase() === slug.toLowerCase() || f.id === slug);
        if (match && match.isActive) {
          setForm(match);
          return;
        }
      }
    }).catch(err => {
      console.warn('Error loading form from Firebase:', err);
    });

    // Default template if fresh
    setForm({
      id: 'general_invite_' + Date.now(),
      slug: slug || 'general-invitation-form',
      title: 'Annual Quiz Day & Invitational Meet | Registration',
      description: 'Official invitation and RSVP registration form for the Nalanda College Quiz Club Annual Meet. Please submit team and delegate details below.',
      scope: 'invitational',
      category: 'Open Category',
      accentColor: '#dc2626',
      limitOneResponse: true,
      isActive: true,
      isStandalone: true,
      createdAt: new Date().toISOString().split('T')[0],
      postSubmitConfig: {
        whatsappGroupLink: 'https://chat.whatsapp.com/sample-ncqc-invite',
        whatsappGroupLabel: 'Join Official Meet WhatsApp Group 💬',
        customNotice: 'Official entry confirmation will be verified at the registration counter upon arrival.'
      },
      fields: [
        { id: 'f_email', label: 'Official Email Address', type: 'email', placeholder: 'school@example.com', required: true, helpText: 'Confirmation pass will be linked to this email.' },
        { id: 'f_inst', label: 'School / Institution Name', type: 'text', placeholder: 'Enter school name', required: true },
        { id: 'f_rep', label: 'Teacher-in-Charge / Representative Name', type: 'text', placeholder: 'Enter representative name', required: true },
        { id: 'f_rep_tel', label: 'Representative Contact Number', type: 'tel', placeholder: '+94 7X XXX XXXX', required: true },
        { 
          id: 'f_team', 
          label: 'Participating Team Squad', 
          type: 'team-members', 
          required: true,
          teamConfig: { memberCount: 4, includeGrade: true, includePhone: true } 
        }
      ]
    });
  }, [slug]);

  // Synchronize team members count strictly to the exact number configured by Admin
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

  const handleCopyId = () => {
    if (submittedId) {
      navigator.clipboard.writeText(submittedId);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

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
      window.scrollTo({ top: 250, behavior: 'smooth' });
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
      competitionSlug: form.isStandalone ? '__standalone__' : (form.competitionSlug || '__standalone__'),
      competitionTitle: form.competitionTitle || (form.isStandalone ? 'Normal Form / Public Event' : 'NCQC Event'),
      isStandalone: form.isStandalone ?? true,
      scope: form.scope || 'invitational',
      category: form.category || 'Senior (Grade 10 - 13)',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
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

    // Save submission directly to Firebase Cloud Database (Real Database)
    await saveFirebaseSubmission(newSubmission);

    setIsSubmitting(false);
    setSubmittedId(generatedRef);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const accentColor = form?.accentColor || '#dc2626';
  const candidateName = formValues['School / Institution Name'] || formValues['Candidate Name'] || teamMembersList[0]?.name || 'Registered Delegate';
  const schoolName = formValues['School / Institution Name'] || formValues['School Name'] || '';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '8.5rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb (Cleanly below navbar!) */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              background: '#ffffff',
              padding: '0.55rem 1.15rem',
              borderRadius: '100px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            &larr; Back to Home
          </Link>

          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#dc2626',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            padding: '0.35rem 0.85rem',
            borderRadius: '100px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc2626' }} />
            Official NCQC Invitation Portal
          </span>
        </div>

        {/* ========================================================================= */}
        {/* SUCCESS CONFIRMATION MODAL & DIGITAL PASS (IMAGE 2, 3 & 4)                */}
        {/* ========================================================================= */}
        {submittedId ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '26px',
            border: '1px solid #e2e8f0',
            padding: '3rem 2rem',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.08)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }} />

            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: '#dcfce7',
              border: '2px solid #86efac',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              margin: '0 auto 1.5rem'
            }}>
              ✓
            </div>

            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Registration Verified &bull; Nalanda College Quiz Club
            </span>

            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0 1rem 0', letterSpacing: '-0.02em' }}>
              {form?.postSubmitConfig?.successTitle || 'SUBMISSION SUCCESSFUL!'}
            </h2>

            <p style={{ color: '#475569', fontSize: '0.98rem', maxWidth: '580px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
              {form?.postSubmitConfig?.successMessage || 'Your application has been logged into the NCQC registry. Please save your Referral ID code for verification and reference.'}
            </p>

            {/* Clean Referral / Registration ID Display */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '1.25rem 2rem',
              maxWidth: '440px',
              margin: '0 auto 2.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
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
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {copiedNotice ? '✓ Copied' : '📋 Copy ID'}
              </button>
            </div>

            {/* WhatsApp Group Join Button (If configured by admin) */}
            {form?.postSubmitConfig?.whatsappGroupLink && (
              <div style={{ marginBottom: '2.25rem' }}>
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
                <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, marginTop: '0.5rem' }}>
                  Click to join for instant schedules, announcements &amp; quiz rounds
                </div>
              </div>
            )}

            {/* Back Links */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <Link
                href="/"
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: '0.9rem'
                }}
              >
                Back to NCQC Homepage
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* THE LIVE STANDALONE FORM                                                  */
          /* ========================================================================= */
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            padding: '3rem 2.5rem',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.06)',
            position: 'relative',
            overflow: 'hidden'
          }}>
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

            {/* Title & Description */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 0.85rem 0', lineHeight: 1.25 }}>
                {form?.title}
              </h1>
              <p style={{ color: '#475569', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                {form?.description}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.65rem' }}>
              {form?.fields.map((field) => {
                const isEmailBox = field.type === 'email';
                const isTeamField = field.type === 'team-members';
                const fieldError = errors[field.label];

                // 1. Email Box (Image 2 Replica)
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
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: fieldError ? '#dc2626' : '#b91c1c', fontWeight: 600 }}>
                        {fieldError || field.helpText || 'Official verification pass will be sent to this email.'}
                      </span>
                    </div>
                  );
                }

                // 2. Team Members Field (Image 5 Requirement)
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
                            Official team members representing your institution (Fixed size set by Admin).
                          </p>
                        </div>
                        <div
                          style={{
                            background: field.teamConfig?.enforceExactCount ? '#fef2f2' : '#ecfdf5',
                            color: field.teamConfig?.enforceExactCount ? '#b91c1c' : '#047857',
                            border: `1px solid ${field.teamConfig?.enforceExactCount ? '#fecaca' : '#a7f3d0'}`,
                            padding: '0.4rem 0.85rem',
                            borderRadius: '100px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span>{field.teamConfig?.enforceExactCount ? '🔒' : '👥'}</span>
                          {field.teamConfig?.enforceExactCount 
                            ? `Strict Squad: Exactly ${field.teamConfig?.memberCount || 4} Members Required` 
                            : `Team Squad: Up to ${field.teamConfig?.memberCount || 4} Members`}
                        </div>
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
                                  placeholder="e.g. John Silva"
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
                                  placeholder="e.g. Grade 12"
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

                // 3. Regular Inputs
                return (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                      {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>

                    {['text', 'number', 'tel'].includes(field.type) && (
                      <input
                        type={field.type}
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
                          outline: 'none'
                        }}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
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
                          outline: 'none'
                        }}
                      >
                        <option value="">-- Choose Option --</option>
                        {(field.options || ['Option 1', 'Option 2']).map((opt, oi) => (
                          <option key={oi} value={opt} style={{ color: '#0f172a' }}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {fieldError && (
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#dc2626', fontWeight: 700, marginTop: '0.35rem' }}>
                        {fieldError}
                      </span>
                    )}
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: `linear-gradient(135deg, ${form?.submitButtonColor || accentColor} 0%, ${form?.submitButtonGradientEnd || '#991b1b'} 100%)`,
                  color: form?.submitButtonTextColor || '#ffffff',
                  border: 'none',
                  padding: '1.15rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  marginTop: '1.25rem',
                  boxShadow: `0 14px 28px -4px ${(form?.submitButtonColor || accentColor)}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  width: '100%'
                }}
              >
                {isSubmitting ? '⏳ Submitting RSVP...' : (form?.submitButtonText || '🚀 Submit Official Registration →')}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
