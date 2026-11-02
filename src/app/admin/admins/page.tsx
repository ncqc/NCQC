'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface AdminAccount {
  email: string;
  role: string;
  status: 'active' | 'suspended';
  isProtected: boolean;
  createdAt: string;
  lastLogin?: number;
}

const PIN_STORAGE_KEY = 'ncqc_master_pin_cache';

export default function AdminUsersManagementPage() {
  const { user } = useAdminAuth();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinVerifying, setPinVerifying] = useState(false);

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // New Admin Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Super Admin'>('Admin');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Check existing session unlock
  useEffect(() => {
    const cachedPin = sessionStorage.getItem(PIN_STORAGE_KEY);
    if (cachedPin === '20083261982228') {
      setIsUnlocked(true);
      fetchAdmins(cachedPin);
    }
  }, []);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Please enter the Master Security Key.');
      return;
    }

    setPinVerifying(true);
    setPinError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_pin', securityPin: pinInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        sessionStorage.setItem(PIN_STORAGE_KEY, pinInput.trim());
        setIsUnlocked(true);
        fetchAdmins(pinInput.trim());
      } else {
        setPinError(data.error || 'Incorrect Master Security Key.');
      }
    } catch {
      setPinError('Security gateway connection error. Please try again.');
    } finally {
      setPinVerifying(false);
    }
  };

  const getPin = () => {
    return sessionStorage.getItem(PIN_STORAGE_KEY) || pinInput.trim() || '20083261982228';
  };

  const fetchAdmins = async (pin?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-security-pin': pin || getPin()
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error('Failed to load administrators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLockConsole = () => {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    setIsUnlocked(false);
    setPinInput('');
    setPinError(null);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setStatusMessage({ text: 'Email and password are required.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsAdding(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securityPin: getPin(),
          email: newEmail.trim(),
          password: newPassword.trim(),
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          text: `✅ Administrator ${newEmail} created successfully! They can now log in immediately.`,
          type: 'success'
        });
        setNewEmail('');
        setNewPassword('');
        setShowAddModal(false);
        fetchAdmins();
      } else {
        setStatusMessage({
          text: `❌ ${data.error || 'Failed to create administrator.'}`,
          type: 'error'
        });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'Network error: ' + err.message, type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleSuspend = async (targetEmail: string, currentStatus: 'active' | 'suspended') => {
    if (targetEmail.toLowerCase() === 'dg.edits65@gmail.com') {
      alert('🔒 Security Protection: dg.edits65@gmail.com is the Root Super Admin and cannot be suspended.');
      return;
    }

    const nextAction = currentStatus === 'active' ? 'suspend' : 'reactivate';
    if (!confirm(`Are you sure you want to ${nextAction} administrator ${targetEmail}?`)) {
      return;
    }

    setActionLoading(targetEmail);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securityPin: getPin(),
          email: targetEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          text: `Account ${targetEmail} is now ${data.status.toUpperCase()}.`,
          type: 'info'
        });
        fetchAdmins();
      } else {
        setStatusMessage({ text: data.error || 'Failed to update account.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAdmin = async (targetEmail: string) => {
    if (targetEmail.toLowerCase() === 'dg.edits65@gmail.com') {
      alert('🔒 Security Violation: dg.edits65@gmail.com is the permanent Root Super Admin and cannot be deleted.');
      return;
    }

    if (!confirm(`⚠️ PERMANENT ACTION: Are you sure you want to permanently delete administrator ${targetEmail}?\n\nThis will completely revoke their access immediately.`)) {
      return;
    }

    setActionLoading(targetEmail);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securityPin: getPin(),
          email: targetEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          text: `🗑️ Administrator ${targetEmail} permanently deleted.`,
          type: 'info'
        });
        fetchAdmins();
      } else {
        setStatusMessage({ text: data.error || 'Failed to delete account.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  // 1. Master Security Key Verification Gate
  if (!isUnlocked) {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(145deg, #0f172a 0%, #060913 100%)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.15)',
          textAlign: 'center'
        }}>
          {/* Security Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.9))',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '1.25rem',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
          }}>
            🛡️
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#f87171',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            RESTRICTED ACCESS LEVEL 0
          </div>

          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
            Master Security Key Required
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 1.75rem 0' }}>
            To manage administrator accounts, register new credentials, or alter permissions, enter the NCQC Master Security Key.
          </p>

          {pinError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              textAlign: 'left'
            }}>
              ⚠️ {pinError}
            </div>
          )}

          <form onSubmit={handleVerifyPin} autoComplete="off">
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Master Security Key..."
                autoFocus
                disabled={pinVerifying}
                style={{
                  width: '100%',
                  background: '#090e1a',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '12px',
                  padding: '0.85rem 3rem 0.85rem 1rem',
                  color: '#ffffff',
                  fontSize: '1rem',
                  letterSpacing: showPin ? 'normal' : '0.25em',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                {showPin ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              disabled={pinVerifying}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.85rem',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: pinVerifying ? 'wait' : 'pointer',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {pinVerifying ? 'Verifying Key...' : 'Unlock Administrator Console →'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.74rem', color: '#64748b' }}>
            Authorized Personnel Only • Hardware IP & Session Logged
          </div>
        </div>
      </div>
    );
  }

  // 2. Unlocked Administrator Management Console
  const activeCount = admins.filter(a => a.status === 'active').length;
  const suspendedCount = admins.filter(a => a.status === 'suspended').length;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Top Banner Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🛡️</span>
            <h1 className="admin-title" style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900 }}>
              Administrator Management
            </h1>
          </div>
          <p className="admin-subtitle" style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
            Real-time credential control, administrator provisioning, and security suspension.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
            }}
          >
            <span>➕</span>
            <span>Add New Admin</span>
          </button>

          <button
            onClick={handleLockConsole}
            title="Lock Administrator Console"
            style={{
              background: '#1e293b',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>🔒</span>
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* Status Notice Toast / Alert */}
      {statusMessage && (
        <div style={{
          background: statusMessage.type === 'success' ? '#ecfdf5' : statusMessage.type === 'error' ? '#fef2f2' : '#f0f9ff',
          border: `1.5px solid ${statusMessage.type === 'success' ? '#a7f3d0' : statusMessage.type === 'error' ? '#fecaca' : '#bae6fd'}`,
          borderRadius: '14px',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: statusMessage.type === 'success' ? '#065f46' : statusMessage.type === 'error' ? '#991b1b' : '#0369a1',
          fontSize: '0.86rem',
          fontWeight: 700
        }}>
          <div>{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>TOTAL ADMINISTRATORS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
            {loading ? '...' : admins.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, marginTop: '0.2rem' }}>Synchronized across Cloud</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>ACTIVE STATUS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '0.2rem' }}>
            {loading ? '...' : activeCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>Permitted Full Access</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>SUSPENDED ACCOUNTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626', marginTop: '0.2rem' }}>
            {loading ? '...' : suspendedCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>Access Revoked</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>PRIMARY ROOT ADMIN</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.4rem', wordBreak: 'break-all' }}>
            dg.edits65@gmail.com
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, marginTop: '0.2rem' }}>🔒 Immutable Protected</div>
        </div>
      </div>

      {/* Add Administrator Modal / Drawer */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.25rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>➕</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  Add New Administrator
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Provision an authorized administrator. They will be immediately able to log into the NCQC Admin Workspace with these credentials.
            </p>

            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Administrator Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                    Access Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Generate Strong
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter admin password (min 6 chars)..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.8rem 0.75rem 0.9rem',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Assigned Privileges / Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff'
                  }}
                >
                  <option value="Admin">Administrator (Standard Privileges)</option>
                  <option value="Super Admin">Super Administrator (Full Privileges)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '0.7rem 1.25rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: isAdding ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {isAdding ? 'Saving Administrator...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Administrators Directory Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Registered Administrators
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Real-time authorization directory synchronized with Firebase Realtime Database and Supabase.
            </p>
          </div>
          <button
            onClick={() => fetchAdmins()}
            disabled={loading}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#334155',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Directory'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(239, 68, 68, 0.2)',
              borderTopColor: '#ef4444',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem'
            }} />
            Loading security directory...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No administrators found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Administrator</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Access Status</th>
                  <th style={{ padding: '1rem' }}>Created / Registered</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isRoot = admin.email.toLowerCase() === 'dg.edits65@gmail.com';
                  const isCurrent = user?.email.toLowerCase() === admin.email.toLowerCase();

                  return (
                    <tr
                      key={admin.email}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: admin.status === 'suspended' ? '#fef2f2' : isRoot ? '#fdf8f6' : '#ffffff',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Email / Identity */}
                      <td style={{ padding: '1.1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isRoot ? 'linear-gradient(135deg, #ef4444, #991b1b)' : admin.status === 'suspended' ? '#94a3b8' : '#0f172a',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            flexShrink: 0
                          }}>
                            {isRoot ? '🛡️' : '👤'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                                {admin.email}
                              </span>
                              {isCurrent && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px'
                                }}>
                                  YOU
                                </span>
                              )}
                              {isRoot && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid #fca5a5'
                                }}>
                                  ROOT OWNER
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {isRoot 
                                ? 'Permanent root super admin. Protected by immutable security protocol.' 
                                : `Terminal administrator • ${admin.email.split('@')[1]}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          padding: '0.3rem 0.7rem',
                          borderRadius: '8px',
                          background: admin.role === 'Super Admin' ? '#fef3c7' : '#f1f5f9',
                          color: admin.role === 'Super Admin' ? '#92400e' : '#334155',
                          border: `1px solid ${admin.role === 'Super Admin' ? '#fde68a' : '#cbd5e1'}`
                        }}>
                          {admin.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.3rem 0.7rem',
                          borderRadius: '100px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: admin.status === 'active' ? '#ecfdf5' : '#fee2e2',
                          color: admin.status === 'active' ? '#065f46' : '#991b1b',
                          border: `1px solid ${admin.status === 'active' ? '#a7f3d0' : '#fca5a5'}`
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: admin.status === 'active' ? '#10b981' : '#ef4444'
                          }} />
                          {admin.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Created */}
                      <td style={{ padding: '1rem', fontSize: '0.78rem', color: '#64748b' }}>
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'System Default'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right' }}>
                        {isRoot ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#94a3b8',
                            background: '#f8fafc',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <span>🔒</span>
                            <span>Protected Super Admin</span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Suspend / Reactivate */}
                            <button
                              onClick={() => handleToggleSuspend(admin.email, admin.status)}
                              disabled={actionLoading === admin.email}
                              style={{
                                background: admin.status === 'active' ? '#fff7ed' : '#ecfdf5',
                                border: `1px solid ${admin.status === 'active' ? '#fdba74' : '#a7f3d0'}`,
                                color: admin.status === 'active' ? '#c2410c' : '#047857',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '8px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: actionLoading === admin.email ? 'wait' : 'pointer'
                              }}
                            >
                              {actionLoading === admin.email 
                                ? 'Updating...' 
                                : admin.status === 'active' ? '⏸️ Suspend' : '▶️ Activate'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteAdmin(admin.email)}
                              disabled={actionLoading === admin.email}
                              title="Delete administrator account"
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '8px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: actionLoading === admin.email ? 'wait' : 'pointer'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Architecture Info Card */}
      <div style={{
        marginTop: '2rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🔒</span>
        <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.55 }}>
          <strong style={{ color: '#0f172a' }}>256-Bit Cryptographic Administrative Safeguard:</strong>
          <br />
          • Administrator passwords are encrypted using SHA-256 cryptographic hashes and verified in constant-time (timing-attack resistant).
          <br />
          • Suspended accounts have their active authentication sessions immediately revoked across all devices.
          <br />
          • The primary Root Administrator account (<code>dg.edits65@gmail.com</code>) is protected by server-side invariants and cannot be suspended or deleted.
          <br />
          • Administrative actions require verification via the Master Security Key (<code>20083261982228</code>).
        </div>
      </div>
    </div>
  );
}
