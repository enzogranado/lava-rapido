import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/parking/rates — Get parking rates
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        businessType: true,
        parkingHourlyRate: true,
        parkingAdditionalHourlyRate: true,
        parkingDailyRate: true,
        parkingGraceMinutes: true,
        parkingSpots: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching parking rates:', error);
    return NextResponse.json({ error: 'Falha ao buscar tarifas de estacionamento' }, { status: 500 });
  }
}

// PUT /api/parking/rates — Update parking rates
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      parkingHourlyRate,
      parkingAdditionalHourlyRate,
      parkingDailyRate,
      parkingGraceMinutes,
      parkingSpots,
      businessType,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (parkingHourlyRate !== undefined) updateData.parkingHourlyRate = parseFloat(parkingHourlyRate) || 10.0;
    if (parkingAdditionalHourlyRate !== undefined) updateData.parkingAdditionalHourlyRate = parseFloat(parkingAdditionalHourlyRate) || 5.0;
    if (parkingDailyRate !== undefined) updateData.parkingDailyRate = parseFloat(parkingDailyRate) || 50.0;
    if (parkingGraceMinutes !== undefined) updateData.parkingGraceMinutes = parseInt(parkingGraceMinutes, 10) || 15;
    if (parkingSpots !== undefined) updateData.parkingSpots = parseInt(parkingSpots, 10) || 30;
    if (businessType && ['LAVA_RAPIDO', 'ESTACIONAMENTO', 'HIBRIDO'].includes(businessType)) {
      updateData.businessType = businessType;
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: {
        businessType: true,
        parkingHourlyRate: true,
        parkingAdditionalHourlyRate: true,
        parkingDailyRate: true,
        parkingGraceMinutes: true,
        parkingSpots: true,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error updating parking rates:', error);
    return NextResponse.json({ error: 'Falha ao atualizar tarifas de estacionamento' }, { status: 500 });
  }
}
