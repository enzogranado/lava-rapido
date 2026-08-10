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
    const { status } = body;

    const validStatuses = ['WAITING', 'IN_SERVICE', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = { status };

    if (status === 'READY') {
      updateData.completedAt = now;
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = now;
      if (!updateData.completedAt) {
        updateData.completedAt = now;
      }
    }

    const wash = await prisma.wash.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true, color: true } },
        items: true,
      },
    });

    return NextResponse.json(wash);
  } catch (error) {
    console.error('Error updating wash status:', error);
    return NextResponse.json({ error: 'Failed to update wash status' }, { status: 500 });
  }
}
