import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/whatsapp/messages — List message log
export async function GET() {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
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
