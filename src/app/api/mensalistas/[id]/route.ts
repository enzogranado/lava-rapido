import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// PUT /api/mensalistas/[id] — Update subscription status, plan, payment info, or mark payment received
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { status, planId, vehicleId, paymentMethod, dueDay, notes, markPaid } = body;

    const existing = await prisma.mensalista.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: 'Mensalista não encontrado' }, { status: 404 });
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId, customerId: existing.customerId } });
      if (!vehicle) {
        return NextResponse.json({ error: 'Veículo não pertence a este cliente' }, { status: 400 });
      }
    }

    if (planId) {
      const plan = await prisma.monthlyPlan.findFirst({ where: { id: planId, tenantId } });
      if (!plan) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
      }
    }

    if (dueDay !== undefined) {
      const parsedDueDay = parseInt(dueDay, 10);
      if (Number.isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 28) {
        return NextResponse.json({ error: 'Dia de vencimento deve ser entre 1 e 28' }, { status: 400 });
      }
    }

    // Reactivating a cancelled/inactive subscription must not create a second ATIVO row for the same customer
    if (status === 'ATIVO' && existing.status !== 'ATIVO') {
      const otherActive = await prisma.mensalista.findFirst({
        where: { tenantId, customerId: existing.customerId, status: 'ATIVO', id: { not: id } },
      });
      if (otherActive) {
        return NextResponse.json(
          { error: 'Este cliente já possui outra assinatura ativa.' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      ...(planId !== undefined && { planId }),
      ...(vehicleId !== undefined && { vehicleId: vehicleId || null }),
      ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || null }),
      ...(dueDay !== undefined && { dueDay: parseInt(dueDay, 10) }),
      ...(notes !== undefined && { notes }),
    };

    if (status !== undefined && status !== existing.status) {
      updateData.status = status;
      if (status === 'CANCELADO') {
        updateData.cancelledAt = new Date();
      } else if (existing.status === 'CANCELADO') {
        updateData.cancelledAt = null;
      }
    }

    if (markPaid) {
      updateData.lastPaymentDate = new Date();
    }

    const mensalista = await prisma.mensalista.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true } },
        plan: { select: { id: true, name: true, price: true, washesIncluded: true } },
      },
    });

    return NextResponse.json(mensalista);
  } catch (error) {
    console.error('Error updating mensalista:', error);
    return NextResponse.json({ error: 'Failed to update mensalista' }, { status: 500 });
  }
}

// DELETE /api/mensalistas/[id] — Remove a subscription record scoped to tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id } = await params;

    const existing = await prisma.mensalista.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: 'Mensalista não encontrado' }, { status: 404 });
    }

    await prisma.mensalista.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mensalista:', error);
    return NextResponse.json({ error: 'Failed to delete mensalista' }, { status: 500 });
  }
}
