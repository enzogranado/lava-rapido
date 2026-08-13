import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/public/tracking/[token] — Public, unauthenticated endpoint for the customer-facing
// tracking page. Must only ever return fields that are safe to show to anyone holding the link:
// never pickupCode (delivery security secret), phone numbers, notes, or tenant/customer ids.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const wash = await prisma.wash.findUnique({
      where: { trackingToken: token },
      include: {
        tenant: { select: { name: true } },
        customer: { select: { name: true } },
        vehicle: { select: { model: true, plate: true, color: true } },
        items: { select: { serviceNameSnapshot: true, quantity: true } },
      },
    });

    if (!wash) {
      return NextResponse.json({ error: 'Link inválido ou atendimento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      businessName: wash.tenant.name,
      customerFirstName: wash.customer.name.split(' ')[0],
      status: wash.status,
      vehicle: wash.vehicle,
      items: wash.items.map((item) => ({ name: item.serviceNameSnapshot, quantity: item.quantity })),
      total: wash.total,
      createdAt: wash.createdAt,
      startedAt: wash.startedAt,
      completedAt: wash.completedAt,
      deliveredAt: wash.deliveredAt,
    });
  } catch (error) {
    console.error('Error fetching public tracking info:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking info' }, { status: 500 });
  }
}
