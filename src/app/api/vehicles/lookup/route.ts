import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/vehicles/lookup?plate=ABC1D23 — Auto-fill vehicle and customer info by plate
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const plateQuery = (searchParams.get('plate') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!plateQuery || plateQuery.length < 3) {
      return NextResponse.json({ found: false, matches: [] });
    }

    // 1. Search in registered Vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        plate: { contains: plateQuery, mode: 'insensitive' },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      take: 5,
    });

    if (vehicles.length > 0) {
      const exactMatch = vehicles.find((v) => v.plate === plateQuery) || (plateQuery.length >= 7 ? vehicles[0] : null);

      return NextResponse.json({
        found: Boolean(exactMatch),
        exactMatch: exactMatch
          ? {
              plate: exactMatch.plate,
              model: exactMatch.model,
              color: exactMatch.color || '',
              customerName: exactMatch.customer?.name || '',
              customerPhone: exactMatch.customer?.phone || '',
            }
          : null,
        matches: vehicles.map((v) => ({
          plate: v.plate,
          model: v.model,
          color: v.color || '',
          customerName: v.customer?.name || '',
          customerPhone: v.customer?.phone || '',
        })),
      });
    }

    // 2. Search in ParkingTicket history if not found in vehicles
    const parkingTicket = await prisma.parkingTicket.findFirst({
      where: {
        tenantId,
        plate: { contains: plateQuery, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (parkingTicket) {
      const isExact = parkingTicket.plate === plateQuery || plateQuery.length >= 7;
      return NextResponse.json({
        found: isExact,
        exactMatch: isExact
          ? {
              plate: parkingTicket.plate,
              model: parkingTicket.model,
              color: parkingTicket.color || '',
              customerName: parkingTicket.customerName || '',
              customerPhone: parkingTicket.customerPhone || '',
            }
          : null,
        matches: [
          {
            plate: parkingTicket.plate,
            model: parkingTicket.model,
            color: parkingTicket.color || '',
            customerName: parkingTicket.customerName || '',
            customerPhone: parkingTicket.customerPhone || '',
          },
        ],
      });
    }

    return NextResponse.json({ found: false, matches: [] });
  } catch (error) {
    console.error('Error in vehicle lookup:', error);
    return NextResponse.json({ error: 'Falha ao buscar veículo' }, { status: 500 });
  }
}
