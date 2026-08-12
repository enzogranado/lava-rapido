import { NextRequest } from 'next/server';
import { COOKIE_NAME, parseSessionToken, type AuthSession } from './session';

export { COOKIE_NAME, parseSessionToken, createSessionToken, type AuthSession } from './session';

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
    tenantName: user.tenant?.name || 'LavaFlow',
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
