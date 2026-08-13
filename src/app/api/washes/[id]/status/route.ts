import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/washes/[id]/status — Change status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, pickupCode, bypassCode, paymentMethod } = body;

    const validStatuses = ['WAITING', 'IN_SERVICE', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const existingWash = await prisma.wash.findUnique({ where: { id } });
    if (!existingWash) {
      return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = { status };

    if (status === 'READY') {
      updateData.completedAt = now;
      if (!existingWash.pickupCode) {
        updateData.pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
      }
    } else if (status === 'DELIVERED') {
      // Security Pickup Code Check
      if (!bypassCode && existingWash.pickupCode) {
        if (!pickupCode || String(pickupCode).trim() !== String(existingWash.pickupCode).trim()) {
          return NextResponse.json(
            { error: 'Código de retirada incorreto! Informe o código de 4 dígitos enviado ao cliente ou use a opção "Confio no cliente".' },
            { status: 400 }
          );
        }
      }

      if (bypassCode) {
        updateData.pickupCodeBypassed = true;
      }
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
      }

      updateData.deliveredAt = now;
      if (!existingWash.completedAt) {
        updateData.completedAt = now;
      }
    }

    let wash: any;
    try {
      wash = await prisma.wash.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, model: true, plate: true, color: true } },
          items: true,
        },
      });
    } catch (err: any) {
      console.error('Prisma update error, retrying without new schema fields:', err?.message);
      delete updateData.pickupCodeBypassed;
      delete updateData.paymentMethod;
      delete updateData.pickupCode;

      wash = await prisma.wash.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, model: true, plate: true, color: true } },
          items: true,
        },
      });
    }

    return NextResponse.json(wash);
  } catch (error: any) {
    console.error('Error updating wash status:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update wash status' }, { status: 500 });
  }
}
