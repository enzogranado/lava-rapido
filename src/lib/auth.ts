import { NextRequest } from 'next/server';

export interface AuthSession {
  userId: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';
  tenantName?: string;
  expiresAt?: number;
}

const COOKIE_NAME = 'lava_session';

// Hash password with salt
export function hashPassword(password: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');
  const salt = 'lava_rapido_secure_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Encode session token with 7-day default expiration
export function createSessionToken(session: AuthSession): string {
  const expiresAt = session.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sessionPayload = { ...session, expiresAt };
  const data = JSON.stringify(sessionPayload);
  return Buffer.from(data).toString('base64');
}

// Decode session token and verify expiration
export function parseSessionToken(token: string): AuthSession | null {
  try {
    const data = Buffer.from(token, 'base64').toString('utf-8');
    const session = JSON.parse(data) as AuthSession;
    
    // Check if token has expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }
    
    return session;
  } catch (err) {
    return null;
  }
}

// Get session from NextRequest cookies
export async function getSession(request: NextRequest): Promise<AuthSession | null> {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie || !cookie.value) return null;

  const session = parseSessionToken(cookie.value);
  if (!session) return null;

  const prisma = (await import('./prisma')).default;

  // Double check if user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  });

  if (!user) return null;

  // Check tenant status if user has a tenant
  if (user.tenant && user.role !== 'SUPER_ADMIN') {
    if (!user.tenant.active || user.tenant.status !== 'APPROVED' || user.tenant.paymentStatus === 'OVERDUE') {
      return null;
    }
  }

  return {
    userId: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role as any,
    tenantName: user.tenant?.name || 'Lava Rápido',
    expiresAt: session.expiresAt,
  };
}

// Helper to enforce tenant id for logged in user (returns null if unauthenticated)
export async function getTenantIdOrFallback(request: NextRequest): Promise<string | null> {
  const session = await getSession(request);
  if (!session) return null;

  if (session.tenantId) {
    return session.tenantId;
  }

  if (session.role === 'SUPER_ADMIN') {
    const prisma = (await import('./prisma')).default;
    const firstTenant = await prisma.tenant.findFirst();
    return firstTenant?.id || null;
  }

  return null;
}

export { COOKIE_NAME };
