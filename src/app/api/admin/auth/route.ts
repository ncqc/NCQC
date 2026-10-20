import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Server-side environment secrets (never exposed to client bundle)
const SECRET = process.env.ADMIN_AUTH_SECRET || '000c6ccab81a2d69f0ef3b470b72907afee36d52ddcf2ce6818034032a759112';

const ADMIN_ACCOUNTS: Record<string, { email: string; hash: string; role: string }> = {
  'kemitharandinu@gmail.com': {
    email: 'kemitharandinu@gmail.com',
    hash: process.env.ADMIN_KEMITHA_HASH || 'c201dedd0567aacd120dc2e73ef6bcfe008ca5a15ce76808641d2e56b61da539',
    role: 'Super Admin'
  },
  'dg.edits65@gmail.com': {
    email: 'dg.edits65@gmail.com',
    hash: process.env.ADMIN_NIKILA_HASH || '02cabd883ba2f306ea1f9510a27478f6ef9d85ce2be6dbc0f2b3e361862c60c1',
    role: 'Super Admin'
  }
};

// In-Memory Rate Limiter (IP + Email tracking)
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

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

    // 1. Rate Limiting Check
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

    // 2. Constant-Time Hash Verification
    const candidateHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    const adminRecord = ADMIN_ACCOUNTS[normalizedEmail];

    let isValid = false;
    if (adminRecord && adminRecord.hash) {
      const candidateBuffer = Buffer.from(candidateHash, 'hex');
      const expectedBuffer = Buffer.from(adminRecord.hash, 'hex');
      if (candidateBuffer.length === expectedBuffer.length) {
        isValid = crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
      }
    }

    if (!isValid) {
      const failInfo = registerFailedAttempt(rateKey);
      // Generic error response to prevent user enumeration
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

    // 4. Generate signed cryptographic token
    const durationMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const now = Date.now();
    const sessionPayload = {
      email: adminRecord.email,
      role: adminRecord.role,
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
