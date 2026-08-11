import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/whatsapp/messages — List message log for current tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: { tenantId },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        wash: {
          include: {
            vehicle: { select: { model: true, plate: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
