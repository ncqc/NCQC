import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import adminsJson from '@/data/admins.json';
import { supabase } from '@/lib/supabase';

export const ADMIN_MASTER_SECURITY_KEY = process.env.ADMIN_MASTER_SECURITY_KEY || '20083261982228';
export const ROOT_PROTECTED_ADMIN = 'dg.edits65@gmail.com';

export interface AdminAccountRecord {
  email: string;
  hashes: string[];
  role: string;
  status: 'active' | 'suspended';
  isProtected?: boolean;
  createdAt: string;
  lastLogin?: number;
}

const adminsFilePath = path.join(process.cwd(), 'src/data/admins.json');
const DB_BASE = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://ncqc-a787e-default-rtdb.asia-southeast1.firebasedatabase.app';

function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().trim().replace(/[.#$[\]]/g, '_');
}

/**
 * Hash password with SHA-256 for secure storage
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

/**
 * Get static initial accounts from JSON
 */
function getLocalAdmins(): Record<string, AdminAccountRecord> {
  const map: Record<string, AdminAccountRecord> = {};
  try {
    let list: AdminAccountRecord[] = [];
    if (fs.existsSync(adminsFilePath)) {
      const content = fs.readFileSync(adminsFilePath, 'utf-8');
      list = JSON.parse(content);
    } else {
      list = adminsJson as AdminAccountRecord[];
    }
    for (const item of list) {
      if (item && item.email) {
        const norm = item.email.toLowerCase().trim();
        map[norm] = {
          ...item,
          email: norm,
          isProtected: norm === ROOT_PROTECTED_ADMIN.toLowerCase()
        };
      }
    }
  } catch (err) {
    console.warn('Error reading local admins file:', err);
    for (const item of (adminsJson as AdminAccountRecord[])) {
      if (item && item.email) {
        const norm = item.email.toLowerCase().trim();
        map[norm] = {
          ...item,
          email: norm,
          isProtected: norm === ROOT_PROTECTED_ADMIN.toLowerCase()
        };
      }
    }
  }
  return map;
}

/**
 * Save updated admin list back to local disk if writable
 */
function writeLocalAdmins(records: Record<string, AdminAccountRecord>): void {
  try {
    const list = Object.values(records);
    fs.writeFileSync(adminsFilePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch {
    // Non-fatal on read-only serverless hosts
  }
}

/**
 * Fetch all administrator accounts from Firebase RTDB + Supabase + Local
 */
export async function getAllAdminAccounts(): Promise<Record<string, AdminAccountRecord>> {
  const accounts = getLocalAdmins();

  // 1. Fetch from Firebase Realtime Database
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const fbRes = await fetch(`${DB_BASE}/admin_users.json`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (fbRes.ok) {
      const fbData = await fbRes.json();
      if (fbData && typeof fbData === 'object') {
        for (const [key, val] of Object.entries(fbData)) {
          const rec = val as any;
          if (rec && rec.email) {
            const norm = rec.email.toLowerCase().trim();
            accounts[norm] = {
              email: norm,
              hashes: Array.isArray(rec.hashes) ? rec.hashes : (rec.hash ? [rec.hash] : []),
              role: rec.role || 'Admin',
              status: rec.status === 'suspended' ? 'suspended' : 'active',
              isProtected: norm === ROOT_PROTECTED_ADMIN.toLowerCase(),
              createdAt: rec.createdAt || new Date().toISOString(),
              lastLogin: rec.lastLogin
            };
          }
        }
      }
    }
  } catch (e) {
    // Fallback to Supabase / local if network timeout
  }

  // 2. Fallback check from Supabase '__admin_accounts__'
  try {
    const { data, error } = await supabase
      .from('competition')
      .select('contentHtml')
      .eq('slug', '__admin_accounts__')
      .single();

    if (!error && data?.contentHtml) {
      const parsed = JSON.parse(data.contentHtml);
      if (Array.isArray(parsed)) {
        for (const rec of parsed) {
          if (rec && rec.email) {
            const norm = rec.email.toLowerCase().trim();
            if (!accounts[norm]) {
              accounts[norm] = {
                ...rec,
                email: norm,
                isProtected: norm === ROOT_PROTECTED_ADMIN.toLowerCase()
              };
            }
          }
        }
      }
    }
  } catch {}

  // 3. Absolute invariant protection: Root super admin must always exist, be active and protected
  const rootEmail = ROOT_PROTECTED_ADMIN.toLowerCase();
  if (!accounts[rootEmail]) {
    accounts[rootEmail] = {
      email: rootEmail,
      hashes: ['02cabd883ba2f306ea1f9510a27478f6ef9d85ce2be6dbc0f2b3e361862c60c1'],
      role: 'Super Admin',
      status: 'active',
      isProtected: true,
      createdAt: '2026-10-01T00:00:00.000Z'
    };
  } else {
    accounts[rootEmail].status = 'active';
    accounts[rootEmail].isProtected = true;
  }

  // Also ensure gamagecdt1@gmail.com is always present
  const gamageEmail = 'gamagecdt1@gmail.com';
  if (!accounts[gamageEmail]) {
    accounts[gamageEmail] = {
      email: gamageEmail,
      hashes: ['1609ac30ef2e8ad5d268e3c2cbad3e5bc1310b92b4d23418d19f6c5dbeb7c8cf'],
      role: 'Admin',
      status: 'active',
      isProtected: false,
      createdAt: '2026-11-02T12:00:00.000Z'
    };
  }

  return accounts;
}

/**
 * Add or update an administrator account across all datastores
 */
export async function saveAdminAccount(
  email: string,
  hashes: string[],
  role: string = 'Admin',
  status: 'active' | 'suspended' = 'active'
): Promise<AdminAccountRecord> {
  const normEmail = email.toLowerCase().trim();
  const accounts = await getAllAdminAccounts();
  const existing = accounts[normEmail];

  const updatedRecord: AdminAccountRecord = {
    email: normEmail,
    hashes: Array.from(new Set([...(existing?.hashes || []), ...hashes])),
    role: normEmail === ROOT_PROTECTED_ADMIN.toLowerCase() ? 'Super Admin' : role,
    status: normEmail === ROOT_PROTECTED_ADMIN.toLowerCase() ? 'active' : status,
    isProtected: normEmail === ROOT_PROTECTED_ADMIN.toLowerCase(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    lastLogin: existing?.lastLogin
  };

  accounts[normEmail] = updatedRecord;

  // 1. Write to Firebase RTDB
  const sanitizedKey = sanitizeEmailKey(normEmail);
  try {
    await fetch(`${DB_BASE}/admin_users/${sanitizedKey}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord)
    });
  } catch (e) {
    console.warn('Firebase RTDB write error:', e);
  }

  // 2. Write to Supabase
  try {
    await supabase.from('competition').upsert({
      slug: '__admin_accounts__',
      title: 'Administrator Accounts Registry',
      contentHtml: JSON.stringify(Object.values(accounts)),
      date: '2026',
      shortDesc: 'Security Accounts Database',
      image: '/logo.png'
    }, { onConflict: 'slug' });
  } catch (e) {
    console.warn('Supabase accounts upsert notice:', e);
  }

  // 3. Write to local file
  writeLocalAdmins(accounts);

  return updatedRecord;
}

/**
 * Suspend or reactivate an admin account (Protected root admin cannot be suspended)
 */
export async function toggleSuspendAdminAccount(email: string): Promise<AdminAccountRecord> {
  const normEmail = email.toLowerCase().trim();
  if (normEmail === ROOT_PROTECTED_ADMIN.toLowerCase()) {
    throw new Error('Security Violation: The primary root administrator account cannot be suspended.');
  }

  const accounts = await getAllAdminAccounts();
  const target = accounts[normEmail];
  if (!target) {
    throw new Error('Administrator account not found.');
  }

  const newStatus: 'active' | 'suspended' = target.status === 'active' ? 'suspended' : 'active';
  target.status = newStatus;

  // Persist update
  const sanitizedKey = sanitizeEmailKey(normEmail);
  try {
    await fetch(`${DB_BASE}/admin_users/${sanitizedKey}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    });
  } catch {}

  try {
    await supabase.from('competition').upsert({
      slug: '__admin_accounts__',
      title: 'Administrator Accounts Registry',
      contentHtml: JSON.stringify(Object.values(accounts)),
      date: '2026',
      shortDesc: 'Security Accounts Database',
      image: '/logo.png'
    }, { onConflict: 'slug' });
  } catch {}

  writeLocalAdmins(accounts);

  return target;
}

/**
 * Delete an administrator account (Protected root admin cannot be deleted)
 */
export async function deleteAdminAccount(email: string): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  if (normEmail === ROOT_PROTECTED_ADMIN.toLowerCase()) {
    throw new Error('Security Violation: The primary root administrator account cannot be deleted.');
  }

  const accounts = await getAllAdminAccounts();
  if (!accounts[normEmail]) {
    throw new Error('Administrator account not found.');
  }

  delete accounts[normEmail];

  // 1. Delete from Firebase RTDB
  const sanitizedKey = sanitizeEmailKey(normEmail);
  try {
    await fetch(`${DB_BASE}/admin_users/${sanitizedKey}.json`, {
      method: 'DELETE'
    });
  } catch {}

  // 2. Also clear active session if any
  try {
    await fetch(`${DB_BASE}/admin_active_sessions/${sanitizedKey}.json`, {
      method: 'DELETE'
    });
  } catch {}

  // 3. Update Supabase
  try {
    await supabase.from('competition').upsert({
      slug: '__admin_accounts__',
      title: 'Administrator Accounts Registry',
      contentHtml: JSON.stringify(Object.values(accounts)),
      date: '2026',
      shortDesc: 'Security Accounts Database',
      image: '/logo.png'
    }, { onConflict: 'slug' });
  } catch {}

  // 4. Update local file
  writeLocalAdmins(accounts);

  return true;
}
