import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// PUT /api/monthly-plans/[id] — Update monthly plan scoped to tenant
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
    const { name, description, price, washesIncluded, active } = body;

    const existing = await prisma.monthlyPlan.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    const plan = await prisma.monthlyPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(washesIncluded !== undefined && {
          washesIncluded: washesIncluded === '' || washesIncluded === null ? null : parseInt(washesIncluded, 10),
        }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating monthly plan:', error);
    return NextResponse.json({ error: 'Failed to update monthly plan' }, { status: 500 });
  }
}

// DELETE /api/monthly-plans/[id] — Delete monthly plan scoped to tenant
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

    const existing = await prisma.monthlyPlan.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    const inUse = await prisma.mensalista.findFirst({ where: { planId: id, status: 'ATIVO' } });
    if (inUse) {
      return NextResponse.json(
        { error: 'Este plano possui mensalistas ativos vinculados. Desative-o em vez de excluir, ou migre os assinantes para outro plano primeiro.' },
        { status: 409 }
      );
    }

    await prisma.monthlyPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monthly plan:', error);
    return NextResponse.json({ error: 'Failed to delete monthly plan' }, { status: 500 });
  }
}
