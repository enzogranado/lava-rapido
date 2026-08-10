import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/washes — List washes with status filtering and relations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const period = searchParams.get('period'); // today, 7d, 30d, etc.

    let dateFilter = undefined;
    const now = new Date();
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { gte: today };
    } else if (period === '7d') {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: d7 };
    } else if (period === '30d') {
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: d30 };
    }

    const washes = await prisma.wash.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true, color: true } },
        items: true,
        whatsappMessages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(washes);
  } catch (error) {
    console.error('Error fetching washes:', error);
    return NextResponse.json({ error: 'Failed to fetch washes' }, { status: 500 });
  }
}

// POST /api/washes — Create new wash / appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, vehicleId, items, discount = 0, notes } = body;

    if (!customerId || !vehicleId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cliente, veículo e pelo menos um serviço são obrigatórios' },
        { status: 400 }
      );
    }

    // Process wash items with snapshots of name and unit price
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
      if (!service) continue;

      const unitPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : service.price;
      const quantity = item.quantity || 1;
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      processedItems.push({
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        unitPrice,
        quantity,
        total: itemTotal,
      });
    }

    const numericDiscount = parseFloat(discount) || 0;
    const total = Math.max(0, subtotal - numericDiscount);

    const wash = await prisma.wash.create({
      data: {
        customerId,
        vehicleId,
        status: 'WAITING',
        subtotal,
        discount: numericDiscount,
        total,
        notes,
        startedAt: new Date(),
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true, color: true } },
        items: true,
      },
    });

    return NextResponse.json(wash, { status: 201 });
  } catch (error) {
    console.error('Error creating wash:', error);
    return NextResponse.json({ error: 'Failed to create wash' }, { status: 500 });
  }
}
