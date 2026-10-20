export interface AdminSession {
  email: string;
  role: string;
  loginTime: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: { email: string; role: string };
  attemptsLeft?: number;
  locked?: boolean;
  remainingSeconds?: number;
}

// Check session status with server (verifies HttpOnly signed cookie)
export async function checkServerSession(): Promise<{ authenticated: boolean; user?: { email: string; role: string } }> {
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return { authenticated: data.authenticated, user: data.user };
    }
    return { authenticated: false };
  } catch (err) {
    console.warn('Session check warning:', err);
    return { authenticated: false };
  }
}

// Authenticate via Server API (no secrets in client JS)
export async function authenticateAdmin(
  emailInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): Promise<LoginResult> {
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailInput.trim(),
        password: passwordInput.trim(),
        rememberMe
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Authentication rejected by security gateway.',
        attemptsLeft: data.attemptsLeft,
        locked: data.locked,
        remainingSeconds: data.remainingSeconds
      };
    }

    return {
      success: true,
      user: data.user
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network or server security gateway error. Please try again.'
    };
  }
}

// Terminate administrator session on server
export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/admin/auth', {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (err) {
    console.warn('Logout warning:', err);
  }
}
