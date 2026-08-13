import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// Avoids visually-ambiguous characters (0/O, 1/l/I) since this may occasionally be read out loud or typed manually.
const TRACKING_TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generateTrackingToken(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let token = '';
  for (let i = 0; i < length; i++) {
    token += TRACKING_TOKEN_CHARS[bytes[i] % TRACKING_TOKEN_CHARS.length];
  }
  return token;
}

// GET /api/washes — List washes with status filtering and relations scoped to tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const mode = searchParams.get('mode'); // 'today_operational' or null
    const period = searchParams.get('period'); // today, 7d, 30d, all

    let whereClause: any = { tenantId };

    if (mode === 'today_operational') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      whereClause.OR = [
        { createdAt: { gte: today } },
        { updatedAt: { gte: today } },
        { status: { in: ['WAITING', 'IN_SERVICE', 'READY'] } },
      ];
    } else {
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

      whereClause = {
        tenantId,
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      };
    }

    const washes = await prisma.wash.findMany({
      where: whereClause,
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

// POST /api/washes — Create new wash / appointment scoped to tenant
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const { customerId, vehicleId, items, discount = 0, notes, trackingToken } = body;

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
      const service = await prisma.service.findFirst({ where: { id: item.serviceId, tenantId } });
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
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    // The client generates this up front (before the create request) so it can open WhatsApp
    // with the tracking link synchronously, inside the same user gesture as the submit click —
    // waiting for this response first would risk the browser blocking the popup. We just need
    // to make sure whatever we end up storing is actually unique.
    let finalTrackingToken: string = typeof trackingToken === 'string' && trackingToken.trim() ? trackingToken.trim() : generateTrackingToken();
    for (let attempts = 0; attempts < 3; attempts++) {
      const collision = await prisma.wash.findUnique({ where: { trackingToken: finalTrackingToken } });
      if (!collision) break;
      finalTrackingToken = generateTrackingToken();
    }

    const wash = await prisma.wash.create({
      data: {
        tenantId,
        customerId,
        vehicleId,
        status: 'WAITING',
        subtotal,
        discount: numericDiscount,
        total,
        notes,
        pickupCode,
        trackingToken: finalTrackingToken,
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
