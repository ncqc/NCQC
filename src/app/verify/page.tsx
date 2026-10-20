'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import VerificationPage from './[id]/page';

function VerifyQueryHandler() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'REG-2026-9933';
  return <VerificationPage />;
}

export default function VerifyRoot() {
  return (
    <Suspense fallback={<div style={{ padding: '10rem 2rem', textAlign: 'center' }}>Loading Verification Portal...</div>}>
      <VerifyQueryHandler />
    </Suspense>
  );
}
