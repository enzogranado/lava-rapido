import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback, getSession } from '@/lib/auth';

// POST /api/auth/verify-pin — Verify 4-digit PIN to unlock Dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Super Admin bypasses PIN lock
    if (session.role === 'SUPER_ADMIN') {
      return NextResponse.json({ success: true });
    }

    const { pin } = await request.json();

    if (!pin || String(pin).trim().length !== 4) {
      return NextResponse.json({ error: 'O PIN deve conter exatamente 4 dígitos numéricos.' }, { status: 400 });
    }

    const tenantId = await getTenantIdOrFallback(request);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { dashboardPin: true },
    });

    const expectedPin = tenant?.dashboardPin || '1234';

    if (String(pin).trim() === expectedPin) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'PIN incorreto. Acesso ao Dashboard negado.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json({ error: 'Falha ao verificar PIN' }, { status: 500 });
  }
}
