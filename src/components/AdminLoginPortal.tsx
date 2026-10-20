'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminLoginPortal() {
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(true);
  const [isPassReadOnly, setIsPassReadOnly] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Strictly enforce empty fields on mount and purge any browser autofill
  useEffect(() => {
    setEmail('');
    setPassword('');
    const t1 = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 60);
    const t2 = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Live countdown timer when locked out
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return;

    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsLocked(false);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutSeconds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        setIsLoading(false);
        setErrorMessage(result.error || 'Authentication rejected by security gateway.');
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        if (result.locked && result.remainingSeconds) {
          setIsLocked(true);
          setLockoutSeconds(result.remainingSeconds);
        }
      }
      // On success, context updates isAuthenticated and the portal unmounts automatically
    } catch {
      setIsLoading(false);
      setErrorMessage('Security gateway connection error. Please try again.');
    }
  };

  const formatLockoutTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 0%, #150a12 0%, #060913 60%, #020408 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background Cyber Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(239, 68, 68, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(239, 68, 68, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 85%)',
        pointerEvents: 'none'
      }} />

      {/* Ambient Red Glow */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '360px',
        height: '360px',
        background: 'rgba(220, 38, 38, 0.12)',
        filter: 'blur(110px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Main Security Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(239, 68, 68, 0.22)',
        borderRadius: '24px',
        padding: '2.5rem 2.25rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(220, 38, 38, 0.12)'
      }}>
        {/* Header with Emblem */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(15, 23, 42, 0.9))',
            border: '2px solid rgba(239, 68, 68, 0.45)',
            borderRadius: '18px',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)',
            marginBottom: '1.1rem'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="NCQC Logo" 
              style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#f87171',
            textTransform: 'uppercase',
            marginBottom: '0.65rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
            RESTRICTED ADMIN GATEWAY
          </div>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: '0 0 0.35rem 0'
          }}>
            Administrative Access
          </h1>
          <p style={{
            fontSize: '0.84rem',
            color: '#94a3b8',
            margin: 0,
            lineHeight: 1.5
          }}>
            Enter verified administrator credentials to unlock the terminal.
          </p>
        </div>

        {/* Lockout Banner */}
        {isLocked && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.4rem' }}>⏳</span>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fca5a5' }}>
                Terminal Temporarily Locked
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fecaca', marginTop: '0.15rem' }}>
                Cooldown remaining: <strong>{formatLockoutTime(lockoutSeconds)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && !isLocked && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}>
            <span style={{ fontSize: '1.1rem', marginTop: '0.05rem' }}>⚠️</span>
            <div style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.45 }}>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Decoy fields to trap browser auto-fill */}
          <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
            <input type="text" name="decoy_user_field" tabIndex={-1} autoComplete="off" />
            <input type="password" name="decoy_pass_field" tabIndex={-1} autoComplete="off" />
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label 
              htmlFor="sec_admin_email_auth"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: '0.4rem'
              }}
            >
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '0.95rem',
                pointerEvents: 'none'
              }}>
                ✉️
              </span>
              <input
                id="sec_admin_email_auth"
                name="sec_terminal_id_no_fill"
                type="email"
                required
                readOnly={isEmailReadOnly}
                onFocus={() => setIsEmailReadOnly(false)}
                onClick={() => setIsEmailReadOnly(false)}
                disabled={isLoading || isLocked}
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="admin-secure-input"
                style={{
                  width: '100%',
                  background: '#090e1a !important',
                  backgroundColor: '#090e1a !important',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  padding: '0.78rem 1rem 0.78rem 2.6rem',
                  color: '#ffffff !important',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label 
                htmlFor="sec_admin_pass_auth"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#cbd5e1'
                }}
              >
                Security Password
              </label>
              {capsLockActive && (
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>
                  ⚠️ CAPS LOCK ON
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '0.95rem',
                pointerEvents: 'none'
              }}>
                🔑
              </span>
              <input
                id="sec_admin_pass_auth"
                name="sec_terminal_key_no_fill"
                type={showPassword ? 'text' : 'password'}
                required
                readOnly={isPassReadOnly}
                onFocus={() => setIsPassReadOnly(false)}
                onClick={() => setIsPassReadOnly(false)}
                disabled={isLoading || isLocked}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                className="admin-secure-input"
                style={{
                  width: '100%',
                  background: '#090e1a !important',
                  backgroundColor: '#090e1a !important',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  padding: '0.78rem 2.8rem 0.78rem 2.6rem',
                  color: '#ffffff !important',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '0.35rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Remember Me & Remaining Attempts */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
            fontSize: '0.78rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#ef4444', cursor: 'pointer' }}
              />
              Keep session active (7 days)
            </label>
            {attemptsLeft !== null && attemptsLeft < 5 && !isLocked && (
              <span style={{ color: attemptsLeft <= 2 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                {attemptsLeft} attempts left
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked}
            style={{
              width: '100%',
              background: isLocked 
                ? '#334155' 
                : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.9rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              cursor: isLocked || isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLocked ? 'none' : '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem'
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                AUTHENTICATING...
              </>
            ) : isLocked ? (
              `LOCKED (${formatLockoutTime(lockoutSeconds)})`
            ) : (
              'UNLOCK ADMIN WORKSPACE →'
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🔒</span>
            <span>256-Bit Cryptographic Shield</span>
          </div>
          <Link 
            href="/"
            style={{ 
              color: '#94a3b8', 
              textDecoration: 'none', 
              fontWeight: 600,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            ← Public Site
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        /* Chrome/Edge autofill override to prevent white/light-blue background bug */
        input.admin-secure-input:-webkit-autofill,
        input.admin-secure-input:-webkit-autofill:hover,
        input.admin-secure-input:-webkit-autofill:focus,
        input.admin-secure-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #090e1a inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
