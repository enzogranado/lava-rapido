import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/mensalistas/[id]/extras — List extra charges for a mensalista
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: mensalistaId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, PAID, or null for all
    const billingMonth = searchParams.get('billingMonth'); // e.g. "2026-08"

    const mensalista = await prisma.mensalista.findFirst({
      where: { id: mensalistaId, tenantId },
    });
    if (!mensalista) {
      return NextResponse.json({ error: 'Mensalista não encontrado' }, { status: 404 });
    }

    const extras = await prisma.mensalistaExtra.findMany({
      where: {
        tenantId,
        mensalistaId,
        ...(status ? { status } : {}),
        ...(billingMonth ? { billingMonth } : {}),
      },
      include: {
        service: { select: { id: true, name: true, price: true } },
        wash: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            vehicle: { select: { model: true, plate: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(extras);
  } catch (error) {
    console.error('Error fetching mensalista extras:', error);
    return NextResponse.json({ error: 'Falha ao buscar extras do mensalista' }, { status: 500 });
  }
}

// POST /api/mensalistas/[id]/extras — Add a new extra charge (wash, service, or repair/custom)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id: mensalistaId } = await params;
    const body = await request.json();
    const {
      serviceId,
      washId,
      description,
      amount,
      category = 'WASH',
      billingMonth,
      notes,
    } = body;

    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 });
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 });
    }

    const mensalista = await prisma.mensalista.findFirst({
      where: { id: mensalistaId, tenantId },
    });
    if (!mensalista) {
      return NextResponse.json({ error: 'Mensalista não encontrado' }, { status: 404 });
    }

    // Default billingMonth to current YYYY-MM if not provided
    const now = new Date();
    const currentMonth = billingMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const extra = await prisma.mensalistaExtra.create({
      data: {
        tenantId,
        mensalistaId,
        serviceId: serviceId || null,
        washId: washId || null,
        description: description.trim(),
        amount: parsedAmount,
        category: category || 'WASH',
        status: 'PENDING',
        billingMonth: currentMonth,
        notes: notes || null,
      },
      include: {
        service: { select: { id: true, name: true, price: true } },
        wash: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            vehicle: { select: { model: true, plate: true } },
          },
        },
      },
    });

    return NextResponse.json(extra, { status: 201 });
  } catch (error) {
    console.error('Error creating mensalista extra:', error);
    return NextResponse.json({ error: 'Falha ao adicionar extra na mensalidade' }, { status: 500 });
  }
}
