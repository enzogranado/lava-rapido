import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback, getSession } from '@/lib/auth';

// POST /api/settings/request-pin-change — Tenant requests a PIN change (requires Super Admin approval)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { currentPin, newPin, reason } = await request.json();

    if (!currentPin || !newPin || !reason) {
      return NextResponse.json(
        { error: 'PIN atual, novo PIN (4 dígitos) e motivo da troca são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanNewPin = String(newPin).trim();
    if (cleanNewPin.length !== 4 || !/^\d{4}$/.test(cleanNewPin)) {
      return NextResponse.json({ error: 'O novo PIN deve conter exatamente 4 dígitos numéricos.' }, { status: 400 });
    }

    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { dashboardPin: true },
    });

    const expectedCurrentPin = tenant?.dashboardPin || '1234';
    if (String(currentPin).trim() !== expectedCurrentPin) {
      return NextResponse.json({ error: 'O PIN atual informado está incorreto.' }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        pendingPinChange: cleanNewPin,
        pinChangeReason: reason.trim(),
        pinChangeStatus: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação de troca de PIN enviada com sucesso! A administração analisará e aprovará a alteração.',
      tenant: updated,
    });
  } catch (error) {
    console.error('Error requesting PIN change:', error);
    return NextResponse.json({ error: 'Falha ao solicitar troca de PIN' }, { status: 500 });
  }
}
