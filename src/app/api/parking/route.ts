import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';
import { computeParkingFee } from '@/lib/parking';

const TRACKING_TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generateTrackingToken(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let token = '';
  for (let i = 0; i < length; i++) {
    token += TRACKING_TOKEN_CHARS[bytes[i] % TRACKING_TOKEN_CHARS.length];
  }
  return token;
}

export { computeParkingFee };

// GET /api/parking — List parked cars and parking stats
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PARKED'; // PARKED, COMPLETED, ALL
    const search = searchParams.get('search') || '';

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        parkingHourlyRate: true,
        parkingAdditionalHourlyRate: true,
        parkingDailyRate: true,
        parkingGraceMinutes: true,
        parkingSpots: true,
      },
    });

    const hourlyRate = tenant?.parkingHourlyRate || 10.0;
    const additionalRate = tenant?.parkingAdditionalHourlyRate || 5.0;
    const graceMinutes = tenant?.parkingGraceMinutes || 15;
    const totalSpots = tenant?.parkingSpots || 30;

    const whereClause: any = { tenantId };

    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { plate: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { spotNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.parkingTicket.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true, color: true } },
        wash: { select: { id: true, status: true, total: true } },
      },
      orderBy: { entryTime: 'desc' },
    });

    const now = new Date();

    // Enrich with dynamic real-time calculation for parked vehicles
    const enrichedTickets = tickets.map((t) => {
      if (t.status === 'PARKED') {
        const { totalMinutes, fee } = computeParkingFee(
          new Date(t.entryTime),
          now,
          t.hourlyRateSnapshot || hourlyRate,
          t.additionalHourlyRateSnapshot || additionalRate,
          graceMinutes
        );

        const currentTotal = fee + (t.washFee || 0) - (t.discount || 0);

        return {
          ...t,
          calculatedMinutes: totalMinutes,
          calculatedStayFee: fee,
          calculatedTotal: Math.max(0, currentTotal),
        };
      }
      return {
        ...t,
        calculatedMinutes: t.totalStayMinutes || 0,
        calculatedStayFee: t.stayFee,
        calculatedTotal: t.total,
      };
    });

    // Compute today stats
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayTickets = await prisma.parkingTicket.findMany({
      where: {
        tenantId,
        createdAt: { gte: todayStart },
      },
      select: {
        status: true,
        total: true,
      },
    });

    const activeParkedCount = await prisma.parkingTicket.count({
      where: { tenantId, status: 'PARKED' },
    });

    const todayCompleted = todayTickets.filter((t) => t.status === 'COMPLETED');
    const todayRevenue = todayCompleted.reduce((sum, t) => sum + t.total, 0);

    return NextResponse.json({
      tickets: enrichedTickets,
      stats: {
        occupiedSpots: activeParkedCount,
        totalSpots,
        availableSpots: Math.max(0, totalSpots - activeParkedCount),
        todayEntriesCount: todayTickets.length,
        todayCompletedCount: todayCompleted.length,
        todayRevenue: Number(todayRevenue.toFixed(2)),
      },
      rates: {
        hourlyRate,
        additionalRate,
        dailyRate: tenant?.parkingDailyRate || 50.0,
        graceMinutes,
      },
    });
  } catch (error: any) {
    console.error('Error fetching parking tickets:', error);
    return NextResponse.json({ error: error?.message || 'Falha ao buscar veículos no estacionamento' }, { status: 500 });
  }
}

// POST /api/parking — Vehicle Check-in
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      plate,
      model,
      color,
      customerName,
      customerPhone,
      spotNumber,
      notes,
      trackingToken,
    } = body;

    if (!plate || !model) {
      return NextResponse.json({ error: 'Placa e modelo do veículo são obrigatórios' }, { status: 400 });
    }

    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'O WhatsApp do cliente é obrigatório para registrar a entrada e envio do código de retirada (mínimo 10 dígitos com DDD).' },
        { status: 400 }
      );
    }

    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPhoneDigits = customerPhone.replace(/\D/g, '');

    // Check if vehicle is already parked
    const alreadyParked = await prisma.parkingTicket.findFirst({
      where: {
        tenantId,
        plate: cleanPlate,
        status: 'PARKED',
      },
    });

    if (alreadyParked) {
      return NextResponse.json(
        { error: `O veículo de placa ${cleanPlate} já consta como estacionado no pátio.` },
        { status: 409 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        parkingHourlyRate: true,
        parkingAdditionalHourlyRate: true,
      },
    });

    // Auto find or create Customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId,
        OR: [
          { phone: customerPhone.trim() },
          { phone: cleanPhoneDigits },
          { phone: `+55${cleanPhoneDigits}` },
          { phone: `55${cleanPhoneDigits}` },
        ],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId,
          name: customerName?.trim() || `Cliente (${cleanPlate})`,
          phone: customerPhone.trim(),
        },
      });
    }

    const customerId = customer.id;

    // Auto find or create Vehicle
    let vehicle = await prisma.vehicle.findFirst({
      where: { tenantId, plate: cleanPlate },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          tenantId,
          customerId: customer.id,
          plate: cleanPlate,
          model: model.trim(),
          color: color?.trim() || null,
        },
      });
    }

    const vehicleId = vehicle.id;

    // Generate 4-digit pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    let finalTrackingToken: string = typeof trackingToken === 'string' && trackingToken.trim()
      ? trackingToken.trim()
      : generateTrackingToken();

    for (let attempts = 0; attempts < 3; attempts++) {
      const collision = await prisma.parkingTicket.findUnique({ where: { trackingToken: finalTrackingToken } });
      if (!collision) break;
      finalTrackingToken = generateTrackingToken();
    }

    const ticket = await prisma.parkingTicket.create({
      data: {
        tenantId,
        customerId,
        vehicleId,
        plate: cleanPlate,
        model: model.trim(),
        color: color?.trim() || null,
        customerName: customerName?.trim() || customer.name,
        customerPhone: customerPhone.trim(),
        status: 'PARKED',
        entryTime: new Date(),
        pickupCode,
        trackingToken: finalTrackingToken,
        spotNumber: spotNumber?.trim() || null,
        notes: notes?.trim() || null,
        hourlyRateSnapshot: tenant?.parkingHourlyRate || 10.0,
        additionalHourlyRateSnapshot: tenant?.parkingAdditionalHourlyRate || 5.0,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true } },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Error in parking check-in:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao registrar entrada no estacionamento' },
      { status: 500 }
    );
  }
}
