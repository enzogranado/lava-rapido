import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';
import { computeParkingFee } from '@/lib/parking';

// PATCH /api/parking/[id]/checkout — Check-out vehicle with 4-digit security code validation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const {
      pickupCode,
      bypassCode = false,
      paymentMethod = 'MONEY',
      washFee = 0,
      discount = 0,
      washId,
      notes,
    } = body;

    const ticket = await prisma.parkingTicket.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket de estacionamento não encontrado' }, { status: 404 });
    }

    if (ticket.status !== 'PARKED') {
      return NextResponse.json({ error: 'Este veículo já deu saída do pátio' }, { status: 400 });
    }

    // Security Code Check
    if (!bypassCode) {
      if (!pickupCode || String(pickupCode).trim() !== String(ticket.pickupCode).trim()) {
        return NextResponse.json(
          {
            error: 'Código de retirada incorreto! Informe o código de 4 dígitos enviado ao cliente ou utilize a liberação "Confio no cliente".',
          },
          { status: 400 }
        );
      }
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        parkingGraceMinutes: true,
      },
    });

    const now = new Date();
    const graceMinutes = tenant?.parkingGraceMinutes || 15;

    const { totalMinutes, fee: stayFee } = computeParkingFee(
      new Date(ticket.entryTime),
      now,
      ticket.hourlyRateSnapshot,
      ticket.additionalHourlyRateSnapshot,
      graceMinutes
    );

    const parsedWashFee = typeof washFee === 'number' ? washFee : parseFloat(washFee) || 0;
    const parsedDiscount = typeof discount === 'number' ? discount : parseFloat(discount) || 0;
    const total = Math.max(0, stayFee + parsedWashFee - parsedDiscount);

    const updated = await prisma.parkingTicket.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        exitTime: now,
        pickupCodeBypassed: Boolean(bypassCode),
        totalStayMinutes: totalMinutes,
        stayFee,
        washFee: parsedWashFee,
        discount: parsedDiscount,
        total,
        paymentMethod: paymentMethod || 'MONEY',
        washId: washId || null,
        notes: notes !== undefined ? notes : ticket.notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error during parking checkout:', error);
    return NextResponse.json({ error: 'Falha ao realizar saída do estacionamento' }, { status: 500 });
  }
}
