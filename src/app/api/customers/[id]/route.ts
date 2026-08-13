import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers/[id] — Get customer details with full history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        washes: {
          include: {
            items: true,
            vehicle: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        mensalistas: {
          include: {
            plan: { select: { id: true, name: true, price: true, washesIncluded: true } },
            vehicle: { select: { id: true, model: true, plate: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const deliveredWashes = customer.washes.filter(w => w.status === 'DELIVERED');
    const totalSpent = deliveredWashes.reduce((sum, w) => sum + w.total, 0);
    const totalVisits = deliveredWashes.length;
    const ticketMedio = totalVisits > 0 ? totalSpent / totalVisits : 0;
    const lastVisit = customer.washes.length > 0 ? customer.washes[0].createdAt : null;

    // Most used service
    const serviceCounts: Record<string, number> = {};
    deliveredWashes.forEach(w => {
      w.items.forEach(item => {
        serviceCounts[item.serviceNameSnapshot] = (serviceCounts[item.serviceNameSnapshot] || 0) + item.quantity;
      });
    });
    const mostUsedService = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Average frequency (days between visits)
    let avgFrequency = 0;
    if (deliveredWashes.length >= 2) {
      const sortedDates = deliveredWashes
        .map(w => new Date(w.createdAt).getTime())
        .sort((a, b) => a - b);
      const totalDays = (sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24);
      avgFrequency = totalDays / (sortedDates.length - 1);
    }

    return NextResponse.json({
      ...customer,
      totalSpent,
      totalVisits,
      ticketMedio,
      lastVisit,
      mostUsedService,
      avgFrequency,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// PUT /api/customers/[id] — Update customer and optionally primary vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, notes, vehicleId, vehicleModel, vehiclePlate, vehicleColor } = body;

    let cleanedPhone = phone ? String(phone).replace(/\D/g, '') : undefined;
    if (cleanedPhone && cleanedPhone.length === 11) cleanedPhone = '55' + cleanedPhone;
    if (cleanedPhone && cleanedPhone.length === 10) cleanedPhone = '55' + cleanedPhone;
    if (cleanedPhone) cleanedPhone = '+' + cleanedPhone;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(cleanedPhone && { phone: cleanedPhone }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
      },
      include: { vehicles: true },
    });

    if (vehicleModel || vehiclePlate || vehicleColor !== undefined) {
      const targetVehicleId = vehicleId || customer.vehicles[0]?.id;
      if (targetVehicleId) {
        const formattedPlate = vehiclePlate ? vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '') : undefined;
        await prisma.vehicle.update({
          where: { id: targetVehicleId },
          data: {
            ...(vehicleModel && { model: vehicleModel }),
            ...(formattedPlate && { plate: formattedPlate }),
            ...(vehicleColor !== undefined && { color: vehicleColor }),
          },
        });
      } else if (vehicleModel && vehiclePlate) {
        const formattedPlate = vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            model: vehicleModel,
            plate: formattedPlate,
            color: vehicleColor || null,
          },
        });
      }
    }

    const updatedCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { vehicles: true },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] — Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
