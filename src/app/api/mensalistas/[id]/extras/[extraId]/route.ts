import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// PATCH /api/mensalistas/[id]/extras/[extraId] — Update extra (status, amount, description, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: mensalistaId, extraId } = await params;
    const body = await request.json();
    const { status, amount, description, notes } = body;

    const existingExtra = await prisma.mensalistaExtra.findFirst({
      where: { id: extraId, mensalistaId, tenantId },
    });
    if (!existingExtra) {
      return NextResponse.json({ error: 'Item extra não encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (status !== 'PENDING' && status !== 'PAID') {
        return NextResponse.json({ error: 'Status deve ser PENDING ou PAID' }, { status: 400 });
      }
      updateData.status = status;
      updateData.paidAt = status === 'PAID' ? new Date() : null;
    }

    if (amount !== undefined) {
      const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
      }
      updateData.amount = parsedAmount;
    }

    if (description !== undefined && description.trim() !== '') {
      updateData.description = description.trim();
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.mensalistaExtra.update({
      where: { id: extraId },
      data: updateData,
      include: {
        service: { select: { id: true, name: true, price: true } },
        wash: {
          select: {
            id: true,
            status: true,
            total: true,
            vehicle: { select: { model: true, plate: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating mensalista extra:', error);
    return NextResponse.json({ error: 'Falha ao atualizar item extra' }, { status: 500 });
  }
}

// DELETE /api/mensalistas/[id]/extras/[extraId] — Remove an extra charge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: mensalistaId, extraId } = await params;

    const existingExtra = await prisma.mensalistaExtra.findFirst({
      where: { id: extraId, mensalistaId, tenantId },
    });
    if (!existingExtra) {
      return NextResponse.json({ error: 'Item extra não encontrado' }, { status: 404 });
    }

    await prisma.mensalistaExtra.delete({
      where: { id: extraId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mensalista extra:', error);
    return NextResponse.json({ error: 'Falha ao remover item extra' }, { status: 500 });
  }
}
