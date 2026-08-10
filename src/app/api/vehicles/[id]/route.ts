import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/vehicles/[id] — Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { model, plate, color, notes } = body;

    const formattedPlate = plate ? plate.toUpperCase().replace(/[^A-Z0-9]/g, '') : undefined;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(model && { model }),
        ...(formattedPlate && { plate: formattedPlate }),
        ...(color !== undefined && { color }),
        ...(notes !== undefined && { notes }),
      },
      include: { customer: true },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

// DELETE /api/vehicles/[id] — Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
