'use client';

import { useEffect, useState } from 'react';

export default function SecurityShield() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Console warning to deter inspection
    try {
      console.clear();
      console.log(
        '%c⛔ STOP! PROTECTED SYSTEM',
        'color: #dc2626; font-size: 32px; font-weight: 900; -webkit-text-stroke: 1px black; padding: 4px;'
      );
      console.log(
        '%cThis application is protected by NCQC Cloud Security Systems.\nInspecting elements, downloading restricted assets, or unauthorized access attempts are strictly prohibited.',
        'color: #f59e0b; font-size: 13px; font-weight: 600; line-height: 1.5;'
      );
    } catch {}

    // Allow full editing access on admin paths
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (isAdmin) return;

    const showSecurityToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    };

    // 1. Prevent Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on input and textarea if needed
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      showSecurityToast('🛡️ Security Active: Right-Click & Inspect are disabled.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = (e.key || '').toLowerCase();

      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('🛡️ Developer tools shortcut is disabled.');
        return false;
      }

      // Ctrl + Shift + I (Inspect)
      // Ctrl + Shift + J (Console)
      // Ctrl + Shift + C (Element picker)
      if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('🛡️ Developer inspection is disabled.');
        return false;
      }

      // Ctrl + U (View Source)
      if (isCtrlOrMeta && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('🛡️ Page source viewing is disabled.');
        return false;
      }

      // Ctrl + S (Save Page)
      if (isCtrlOrMeta && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#f8fafc',
        padding: '10px 20px',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 1px 1px rgba(220, 38, 38, 0.4)',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        zIndex: 999999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        letterSpacing: '0.02em',
        animation: 'fadeInUp 0.25s ease-out',
      }}
    >
      <span>{toastMessage}</span>
    </div>
  );
}
