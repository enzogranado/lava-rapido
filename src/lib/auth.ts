import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from './prisma';

export interface AuthSession {
  userId: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';
  tenantName?: string;
}

const COOKIE_NAME = 'lava_session';

// Hash password with salt
export function hashPassword(password: string): string {
  const salt = 'lava_rapido_secure_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Encode session token
export function createSessionToken(session: AuthSession): string {
  const data = JSON.stringify(session);
  return Buffer.from(data).toString('base64');
}

// Decode session token
export function parseSessionToken(token: string): AuthSession | null {
  try {
    const data = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(data) as AuthSession;
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

  // Double check if user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role as any,
    tenantName: user.tenant?.name || 'Lava Rápido',
  };
}

// Helper to enforce tenant id or fallback to default
export async function getTenantIdOrFallback(request: NextRequest): Promise<string> {
  const session = await getSession(request);
  if (session && session.tenantId) {
    return session.tenantId;
  }

  // Fallback to first available tenant or 'tenant-default'
  const firstTenant = await prisma.tenant.findFirst();
  return firstTenant?.id || 'tenant-default';
}

export { COOKIE_NAME };
