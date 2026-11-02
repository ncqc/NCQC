import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { 
  ADMIN_MASTER_SECURITY_KEY, 
  ROOT_PROTECTED_ADMIN, 
  getAllAdminAccounts, 
  saveAdminAccount, 
  toggleSuspendAdminAccount, 
  deleteAdminAccount, 
  hashPassword 
} from '@/lib/adminUsers';

const SECRET = process.env.ADMIN_AUTH_SECRET || '000c6ccab81a2d69f0ef3b470b72907afee36d52ddcf2ce6818034032a759112';

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
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function verifyPinOrAuth(req: NextRequest, pinFromBody?: string): { authorized: boolean; reason?: string } {
  const pinHeader = req.headers.get('x-security-pin');
  const providedPin = (pinFromBody || pinHeader || '').trim();

  if (providedPin === ADMIN_MASTER_SECURITY_KEY) {
    return { authorized: true };
  }

  // Also verify admin session cookie
  const token = req.cookies.get('ncqc_admin_token')?.value;
  if (token) {
    const payload = verifySignedToken(token);
    if (payload && payload.email) {
      return { authorized: true };
    }
  }

  return { authorized: false, reason: 'Master security key or administrator authorization required.' };
}

// GET: Retrieve public sanitized list of administrator accounts
export async function GET(req: NextRequest) {
  const authCheck = verifyPinOrAuth(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ success: false, error: authCheck.reason }, { status: 401 });
  }

  try {
    const all = await getAllAdminAccounts();
    const sanitizedList = Object.values(all).map(acc => ({
      email: acc.email,
      role: acc.role || 'Admin',
      status: acc.status || 'active',
      isProtected: acc.email.toLowerCase() === ROOT_PROTECTED_ADMIN.toLowerCase(),
      createdAt: acc.createdAt || new Date().toISOString(),
      lastLogin: acc.lastLogin
    }));

    return NextResponse.json({
      success: true,
      admins: sanitizedList
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add a new administrator or verify security key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, securityPin, email, password, role } = body;

    // Sub-action: Verify master security key only
    if (action === 'verify_pin') {
      if ((securityPin || '').trim() === ADMIN_MASTER_SECURITY_KEY) {
        return NextResponse.json({ success: true, verified: true });
      }
      return NextResponse.json(
        { success: false, error: 'Incorrect Master Security Key.' },
        { status: 403 }
      );
    }

    // Creating new administrator account
    const pin = (securityPin || req.headers.get('x-security-pin') || '').trim();
    if (pin !== ADMIN_MASTER_SECURITY_KEY) {
      return NextResponse.json(
        { success: false, error: 'Master Security Key (20083261982228) is required to register administrators.' },
        { status: 403 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid administrator email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normEmail = email.toLowerCase().trim();
    const passHash = hashPassword(password);
    const assignedRole = role === 'Super Admin' ? 'Super Admin' : 'Admin';

    const saved = await saveAdminAccount(normEmail, [passHash], assignedRole, 'active');

    return NextResponse.json({
      success: true,
      message: `Administrator account ${normEmail} created successfully.`,
      account: {
        email: saved.email,
        role: saved.role,
        status: saved.status,
        isProtected: saved.isProtected,
        createdAt: saved.createdAt
      }
    });
  } catch (err: any) {
    console.error('Error adding admin account:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Suspend or reactivate an administrator account
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { securityPin, email } = body;

    const pin = (securityPin || req.headers.get('x-security-pin') || '').trim();
    if (pin !== ADMIN_MASTER_SECURITY_KEY) {
      return NextResponse.json(
        { success: false, error: 'Master Security Key is required to suspend or activate accounts.' },
        { status: 403 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Administrator email is required.' }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();
    if (normEmail === ROOT_PROTECTED_ADMIN.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: `Security Violation: Root administrator (${ROOT_PROTECTED_ADMIN}) is immutable and cannot be suspended.` },
        { status: 403 }
      );
    }

    const updated = await toggleSuspendAdminAccount(normEmail);

    return NextResponse.json({
      success: true,
      message: `Account ${normEmail} status changed to ${updated.status}.`,
      status: updated.status,
      email: updated.email
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Remove an administrator account permanently
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { securityPin, email } = body;

    const pin = (securityPin || req.headers.get('x-security-pin') || '').trim();
    if (pin !== ADMIN_MASTER_SECURITY_KEY) {
      return NextResponse.json(
        { success: false, error: 'Master Security Key is required to delete administrator accounts.' },
        { status: 403 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Administrator email is required.' }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();
    if (normEmail === ROOT_PROTECTED_ADMIN.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: `Security Violation: Primary root administrator (${ROOT_PROTECTED_ADMIN}) is protected and cannot be deleted.` },
        { status: 403 }
      );
    }

    await deleteAdminAccount(normEmail);

    return NextResponse.json({
      success: true,
      message: `Administrator account ${normEmail} permanently deleted.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
