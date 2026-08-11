import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/vehicles — List vehicles scoped to tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
        ...(search
          ? {
              OR: [
                { model: { contains: search, mode: 'insensitive' } },
                { plate: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

// POST /api/vehicles — Create vehicle scoped to tenant
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const { customerId, model, plate, color, notes } = body;

    if (!customerId || !model || !plate) {
      return NextResponse.json(
        { error: 'Cliente, modelo e placa são obrigatórios' },
        { status: 400 }
      );
    }

    const formattedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        customerId,
        model,
        plate: formattedPlate,
        color,
        notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um veículo cadastrado com esta placa' }, { status: 409 });
    }
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
