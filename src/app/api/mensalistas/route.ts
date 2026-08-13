import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// A due date that hasn't been paid past yet this month counts as overdue.
// No stored "ATRASADO" status — this is recomputed on every read so it never goes stale.
function computeIsOverdue(dueDay: number, lastPaymentDate: Date | null, now: Date): boolean {
  const currentDue = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (now < currentDue) return false;
  if (!lastPaymentDate) return true;
  return new Date(lastPaymentDate) < currentDue;
}

// GET /api/mensalistas — List monthly subscribers scoped to tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // ATIVO, CANCELADO, INATIVO, or null for all

    const mensalistas = await prisma.mensalista.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { customer: { phone: { contains: search, mode: 'insensitive' } } },
                { vehicle: { plate: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true } },
        plan: { select: { id: true, name: true, price: true, washesIncluded: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const result = mensalistas.map((m) => ({
      ...m,
      isOverdue: m.status === 'ATIVO' ? computeIsOverdue(m.dueDay, m.lastPaymentDate, now) : false,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching mensalistas:', error);
    return NextResponse.json({ error: 'Failed to fetch mensalistas' }, { status: 500 });
  }
}

// POST /api/mensalistas — Register a customer as a monthly subscriber
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const { customerId, vehicleId, planId, paymentMethod, dueDay, notes } = body;

    if (!customerId || !planId || !dueDay) {
      return NextResponse.json({ error: 'Cliente, plano e dia de vencimento são obrigatórios' }, { status: 400 });
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (Number.isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 28) {
      return NextResponse.json({ error: 'Dia de vencimento deve ser entre 1 e 28' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const plan = await prisma.monthlyPlan.findFirst({ where: { id: planId, tenantId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId, customerId } });
      if (!vehicle) {
        return NextResponse.json({ error: 'Veículo não pertence a este cliente' }, { status: 400 });
      }
    }

    const existingActive = await prisma.mensalista.findFirst({
      where: { tenantId, customerId, status: 'ATIVO' },
    });
    if (existingActive) {
      return NextResponse.json(
        { error: 'Este cliente já possui uma assinatura ativa. Edite a assinatura existente em vez de criar outra.', existingId: existingActive.id },
        { status: 409 }
      );
    }

    const mensalista = await prisma.mensalista.create({
      data: {
        tenantId,
        customerId,
        vehicleId: vehicleId || null,
        planId,
        status: 'ATIVO',
        paymentMethod: paymentMethod || null,
        dueDay: parsedDueDay,
        notes: notes || null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true } },
        plan: { select: { id: true, name: true, price: true, washesIncluded: true } },
      },
    });

    return NextResponse.json(mensalista, { status: 201 });
  } catch (error) {
    console.error('Error creating mensalista:', error);
    return NextResponse.json({ error: 'Failed to create mensalista' }, { status: 500 });
  }
}
