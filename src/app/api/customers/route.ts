import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/customers — List all customers with stats and vehicles scoped to tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { vehicles: { some: { plate: { contains: search, mode: 'insensitive' }, tenantId } } },
                { vehicles: { some: { model: { contains: search, mode: 'insensitive' }, tenantId } } },
              ],
            }
          : {}),
      },
      include: {
        vehicles: { where: { tenantId } },
        washes: {
          where: { tenantId, status: { not: 'CANCELLED' } },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: sortBy === 'name' ? { name: sortOrder as 'asc' | 'desc' } : { createdAt: 'desc' },
    });

    const customersWithStats = customers.map((customer) => {
      const deliveredWashes = customer.washes.filter(w => w.status === 'DELIVERED');
      const totalSpent = deliveredWashes.reduce((sum, w) => sum + w.total, 0);
      const lastVisit = customer.washes.length > 0 ? customer.washes[0].createdAt : null;
      const totalVisits = deliveredWashes.length;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes,
        createdAt: customer.createdAt,
        vehicles: customer.vehicles,
        totalSpent,
        lastVisit,
        totalVisits,
      };
    });

    // Sort by derived fields if needed
    if (sortBy === 'totalSpent') {
      customersWithStats.sort((a, b) =>
        sortOrder === 'desc' ? b.totalSpent - a.totalSpent : a.totalSpent - b.totalSpent
      );
    } else if (sortBy === 'lastVisit') {
      customersWithStats.sort((a, b) => {
        const aDate = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const bDate = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
      });
    }

    return NextResponse.json(customersWithStats);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST /api/customers — Create a new customer with vehicle in one step scoped to tenant
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    const body = await request.json();
    const { name, phone, notes, vehicleModel, vehiclePlate, vehicleColor } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 });
    }

    // Clean phone number
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 11) cleanedPhone = '55' + cleanedPhone;
    if (cleanedPhone.length === 10) cleanedPhone = '55' + cleanedPhone;
    cleanedPhone = '+' + cleanedPhone;

    const formattedPlate = vehiclePlate ? vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '') : null;

    // Create customer with nested vehicle if model & plate provided
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name,
        phone: cleanedPhone,
        notes,
        ...(vehicleModel && formattedPlate
          ? {
              vehicles: {
                create: {
                  tenantId,
                  model: vehicleModel,
                  plate: formattedPlate,
                  color: vehicleColor || null,
                },
              },
            }
          : {}),
      },
      include: { vehicles: true },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um cliente ou veículo cadastrado com esses dados (Telefone ou Placa duplicados)' }, { status: 409 });
    }
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
