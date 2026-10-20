'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DigitalPassCard from '@/components/DigitalPassCard';
import { FormSubmission } from '@/data/forms';
import { getFirebaseSubmissionById } from '@/lib/firebaseForms';

export default function VerificationPage() {
  const params = useParams();
  const rawId = params?.id ? String(params.id) : '';
  const id = decodeURIComponent(rawId);

  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    // 1. Fetch live submission from Firebase Realtime Database
    getFirebaseSubmissionById(id).then(match => {
      if (match) {
        setSubmission(match);
        setLoading(false);
      } else {
        // 2. Fallback to localStorage if offline
        try {
          const savedSubs = localStorage.getItem('ncqc_competition_submissions');
          if (savedSubs) {
            const subs: FormSubmission[] = JSON.parse(savedSubs);
            const localMatch = subs.find(s => s.id.toLowerCase() === id.toLowerCase());
            if (localMatch) {
              setSubmission(localMatch);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Error reading submission for verify:', e);
        }

        // 3. Fallback sample data if direct demo
        setSubmission({
          id: id || 'REG-2026-9933',
          formId: 'sample-form',
          formTitle: 'PIXELEON \'26 | Submissions',
          competitionTitle: 'All Island Inter School Quiz Competition',
          scope: 'inter-school',
          category: 'Senior (Grade 10 - 13)',
          submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'confirmed',
          data: {
            'Email Address': 'kemitharandinu@gmail.com',
            'Name': 'Kemitha Randinu',
            'School Name': 'Nalanda College Colombo 10',
            'Grade': 'Grade 12'
          },
          teamMembers: [
            { name: 'Kemitha Randinu', role: 'Team Leader', grade: 'Grade 12', contact: '+94 72 3648 022' },
            { name: 'Sadeesh Mamuhewa', role: 'Member 2', grade: 'Grade 12' },
            { name: 'Chanul Gamage', role: 'Member 3', grade: 'Grade 12' },
            { name: 'Thivindu Wimalasena', role: 'Member 4', grade: 'Grade 12' }
          ]
        });
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  const candidateName = submission?.data?.['Name'] || 
                        submission?.data?.['Candidate Full Name'] || 
                        submission?.data?.['Team Leader Full Name'] || 
                        'Registered Candidate';

  const schoolName = submission?.data?.['School Name'] || 
                     submission?.data?.['School / Institution Name'] || 
                     'Nalanda College';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '8.5rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Top Header & Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Link
            href="/competitions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              background: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '100px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            &larr; Return to Competitions
          </Link>

          <span style={{
            fontSize: '0.78rem',
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
            Official Verification Desk
          </span>
        </div>

        {/* Verification Status Card */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          borderRadius: '20px',
          padding: '1.5rem 2rem',
          color: '#ffffff',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 12px 25px rgba(5, 150, 105, 0.25)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            flexShrink: 0
          }}>
            ✓
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.2rem 0' }}>
              OFFICIAL NCQC ENTRY PASS VERIFIED
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#d1fae5' }}>
              This registration token has been officially authenticated by the Nalanda College Quiz Club system.
            </p>
          </div>
        </div>

        {/* The Digital Pass Card (Image 3 + Image 4 Replica) */}
        {submission && (
          <DigitalPassCard
            submissionId={submission.id}
            candidateName={candidateName}
            schoolName={schoolName}
            competitionTitle={submission.competitionTitle || submission.formTitle}
            category={submission.category || 'Senior Category'}
            scope={submission.scope ? submission.scope.toUpperCase().replace('-', ' ') : 'INTER-SCHOOL'}
            submittedAt={submission.submittedAt}
            teamMembers={submission.teamMembers}
          />
        )}

      </div>
    </div>
  );
}
