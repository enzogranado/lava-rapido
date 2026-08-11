export interface AuthSession {
  userId: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';
  tenantName?: string;
  expiresAt?: number;
}

export const COOKIE_NAME = 'lava_session';

// Decode session token and verify expiration in Edge Runtime & Node
export function parseSessionToken(token: string): AuthSession | null {
  try {
    let data: string;
    if (typeof atob === 'function') {
      data = atob(token);
    } else {
      data = Buffer.from(token, 'base64').toString('utf-8');
    }
    const session = JSON.parse(data) as AuthSession;
    
    // Check if token has expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

// Encode session token with 7-day default expiration
export function createSessionToken(session: AuthSession): string {
  const expiresAt = session.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sessionPayload = { ...session, expiresAt };
  const data = JSON.stringify(sessionPayload);
  if (typeof btoa === 'function') {
    return btoa(data);
  }
  return Buffer.from(data).toString('base64');
}
