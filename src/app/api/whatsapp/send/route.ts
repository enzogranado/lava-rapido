import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { whatsappService } from '@/services/whatsappService';

// POST /api/whatsapp/send — Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { washId } = body;

    if (!washId) {
      return NextResponse.json({ error: 'ID do atendimento é obrigatório' }, { status: 400 });
    }

    const result = await whatsappService.sendReadyNotification(washId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error);
    const message = error instanceof Error ? error.message : 'Falha ao enviar mensagem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
