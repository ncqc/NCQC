import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Server-side environment secrets (never exposed to client bundle)
const SECRET = process.env.ADMIN_AUTH_SECRET || '000c6ccab81a2d69f0ef3b470b72907afee36d52ddcf2ce6818034032a759112';
const DB_BASE = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://ncqc-a787e-default-rtdb.firebaseio.com';

const ADMIN_ACCOUNTS: Record<string, { email: string; hashes: string[]; role: string }> = {
  'sadeeshmmal@gmail.com': {
    email: 'sadeeshmmal@gmail.com',
    hashes: [
      '45bf00e7e7a00725183c14884b3ec477c118dc10ec8bc2308d7f8d3dd8bec6ff' // sadeesh@123
    ],
    role: 'Super Admin'
  },
  'kemitharandinu@gmail.com': {
    email: 'kemitharandinu@gmail.com',
    hashes: [
      '0441b05173cd1b9743c639397bb6a7fa46541c5aa6a12541ceb1bc7c2a0bdddc', // Kemitha2008326@
      'c201dedd0567aacd120dc2e73ef6bcfe008ca5a15ce76808641d2e56b61da539'  // Kemitha2008316@
    ],
    role: 'Super Admin'
  },
  'dg.edits65@gmail.com': {
    email: 'dg.edits65@gmail.com',
    hashes: [
      '02cabd883ba2f306ea1f9510a27478f6ef9d85ce2be6dbc0f2b3e361862c60c1'  // Nikila2008326@
    ],
    role: 'Super Admin'
  }
};

// Single-device active session enforcement (In-memory + Firebase sync)
const activeSessionsMap = new Map<string, string>(); // email -> sessionId

async function getActiveSessionId(email: string): Promise<string | null> {
  const normalized = email.toLowerCase().trim();
  if (activeSessionsMap.has(normalized)) {
    return activeSessionsMap.get(normalized)!;
  }
  try {
    const sanitizedEmail = normalized.replace(/[.#$[\]]/g, '_');
    const res = await fetch(`${DB_BASE}/admin_active_sessions/${sanitizedEmail}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.sessionId) {
        activeSessionsMap.set(normalized, data.sessionId);
        return data.sessionId;
      }
    }
  } catch {}
  return null;
}

async function setActiveSessionId(email: string, sessionId: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  activeSessionsMap.set(normalized, sessionId);
  try {
    const sanitizedEmail = normalized.replace(/[.#$[\]]/g, '_');
    await fetch(`${DB_BASE}/admin_active_sessions/${sanitizedEmail}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, lastLogin: Date.now() })
    });
  } catch {}
}

const rateLimitMap = new Map<string, { attempts: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

function getClientIdentifier(req: NextRequest, email: string): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  return `${ip}_${email.trim().toLowerCase()}`;
}

function checkRateLimit(key: string): { isLocked: boolean; remainingSecs: number; attemptsLeft: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) return { isLocked: false, remainingSecs: 0, attemptsLeft: MAX_ATTEMPTS };

  if (entry.lockedUntil > now) {
    return {
      isLocked: true,
      remainingSecs: Math.ceil((entry.lockedUntil - now) / 1000),
      attemptsLeft: 0
    };
  }

  // Reset if lockout period passed
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    rateLimitMap.delete(key);
    return { isLocked: false, remainingSecs: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  return {
    isLocked: false,
    remainingSecs: 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - entry.attempts)
  };
}

function registerFailedAttempt(key: string): { isLocked: boolean; remainingSecs: number; attemptsLeft: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    rateLimitMap.set(key, entry);
    return { isLocked: true, remainingSecs: Math.ceil(LOCKOUT_MS / 1000), attemptsLeft: 0 };
  }

  rateLimitMap.set(key, entry);
  return {
    isLocked: false,
    remainingSecs: 0,
    attemptsLeft: MAX_ATTEMPTS - entry.attempts
  };
}

function clearRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// Cryptographic token helpers
function createSignedToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifySignedToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// GET: Verify existing session from HttpOnly cookie
export async function GET(req: NextRequest) {
  const token = req.cookies.get('ncqc_admin_token')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifySignedToken(token);
  if (!payload || !payload.email) {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    res.cookies.delete('ncqc_admin_token');
    return res;
  }

  // Ensure email is still in authorized admin list
  if (!ADMIN_ACCOUNTS[payload.email.toLowerCase()]) {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    res.cookies.delete('ncqc_admin_token');
    return res;
  }

  // Single-device active session enforcement: check if another device logged in
  if (payload.sessionId) {
    const activeSessionId = await getActiveSessionId(payload.email);
    if (activeSessionId && activeSessionId !== payload.sessionId) {
      const res = NextResponse.json({ 
        authenticated: false, 
        concurrentSession: true,
        error: 'Session Terminated: This administrator account was logged in from another device.' 
      }, { status: 401 });
      res.cookies.delete('ncqc_admin_token');
      return res;
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: payload.email,
      role: payload.role || 'Super Admin'
    }
  });
}

// POST: Authenticate credentials securely on the server
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Administrator email and security password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const rateKey = getClientIdentifier(req, normalizedEmail);
    const adminRecord = ADMIN_ACCOUNTS[normalizedEmail];

    // Must be an authorized admin account
    if (!adminRecord) {
      const failInfo = registerFailedAttempt(rateKey);
      return NextResponse.json(
        {
          success: false,
          error: `Authentication Failed: Invalid administrator credentials. ${failInfo.attemptsLeft} attempt${failInfo.attemptsLeft !== 1 ? 's' : ''} remaining.`,
          attemptsLeft: failInfo.attemptsLeft
        },
        { status: 401 }
      );
    }

    let isValid = false;

    // 1. Direct validation via Firebase Authentication REST API
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCTyrQWbVNEbPWp56GVadbhXmlB9oq2-b0';
    try {
      const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password: cleanPassword,
          returnSecureToken: true
        })
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData && fbData.registered && fbData.email && fbData.email.toLowerCase() === normalizedEmail) {
          isValid = true;
        }
      }
    } catch (fbErr) {
      console.warn('Firebase Auth REST check notice:', fbErr);
    }

    // 2. High-speed SHA-256 constant-time hash verification fallback
    if (!isValid && adminRecord.hashes) {
      const candidateHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
      const candidateBuffer = Buffer.from(candidateHash, 'hex');
      for (const expectedHash of adminRecord.hashes) {
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        if (candidateBuffer.length === expectedBuffer.length) {
          if (crypto.timingSafeEqual(candidateBuffer, expectedBuffer)) {
            isValid = true;
            break;
          }
        }
      }
    }

    if (!isValid) {
      // Check lockout if too many failed attempts
      const rateStatus = checkRateLimit(rateKey);
      if (rateStatus.isLocked) {
        const minutes = Math.ceil(rateStatus.remainingSecs / 60);
        return NextResponse.json(
          {
            success: false,
            error: `Security Lockout Active: Too many failed login attempts. Terminal locked for ${minutes} minute${minutes > 1 ? 's' : ''}.`,
            locked: true,
            remainingSeconds: rateStatus.remainingSecs
          },
          { status: 429 }
        );
      }

      const failInfo = registerFailedAttempt(rateKey);
      if (failInfo.isLocked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Security Lockout Triggered: 5 failed attempts reached. Terminal locked for 15 minutes.',
            locked: true,
            remainingSeconds: failInfo.remainingSecs
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Authentication Failed: Invalid administrator credentials. ${failInfo.attemptsLeft} attempt${failInfo.attemptsLeft !== 1 ? 's' : ''} remaining.`,
          attemptsLeft: failInfo.attemptsLeft
        },
        { status: 401 }
      );
    }

    // 3. Clear rate limit on successful authentication
    clearRateLimit(rateKey);

    // 4. Generate unique sessionId and register active device session
    const sessionId = crypto.randomUUID();
    await setActiveSessionId(normalizedEmail, sessionId);

    const durationMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const now = Date.now();
    const sessionPayload = {
      email: adminRecord.email,
      role: adminRecord.role,
      sessionId,
      iat: now,
      exp: now + durationMs
    };

    const token = createSignedToken(sessionPayload);

    // 5. Build response and set HttpOnly SameSite=Strict cookie
    const response = NextResponse.json({
      success: true,
      user: {
        email: adminRecord.email,
        role: adminRecord.role
      }
    });

    response.cookies.set({
      name: 'ncqc_admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(durationMs / 1000)
    });

    return response;
  } catch (err: any) {
    console.error('Admin authentication API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal security authentication error.' },
      { status: 500 }
    );
  }
}

// DELETE: Sign out and clear HttpOnly cookie
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Administrator session terminated.' });
  response.cookies.set({
    name: 'ncqc_admin_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
  return response;
}
