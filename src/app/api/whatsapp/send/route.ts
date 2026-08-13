import { NextRequest, NextResponse } from 'next/server';
import { whatsappService, type WhatsAppMessageType } from '@/services/whatsappService';

const VALID_TYPES: WhatsAppMessageType[] = ['READY', 'ENTRY_CODE', 'TRACKING'];

// POST /api/whatsapp/send — Send/log a WhatsApp message for a wash. `type` picks the template
// (READY/ENTRY_CODE/TRACKING); defaults to READY so existing callers keep working unchanged.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { washId, type } = body;

    if (!washId) {
      return NextResponse.json({ error: 'ID do atendimento é obrigatório' }, { status: 400 });
    }

    const messageType: WhatsAppMessageType = VALID_TYPES.includes(type) ? type : 'READY';
    const origin = new URL(request.url).origin;

    const result = await whatsappService.sendMessage(washId, messageType, { origin });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error);
    const message = error instanceof Error ? error.message : 'Falha ao enviar mensagem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
