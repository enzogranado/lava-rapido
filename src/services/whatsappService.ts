import prisma from '@/lib/prisma';
import { buildReadyMessage, buildEntryCodeMessage, buildTrackingMessage } from '@/lib/utils';

export type WhatsAppMessageType = 'READY' | 'ENTRY_CODE' | 'TRACKING';

export const whatsappService = {
  // Builds the message text and sends/logs it. `type` decides which template is used —
  // READY and TRACKING are tenant-configurable (Configurações), ENTRY_CODE is fixed, matching
  // how buildReadyMessage/buildEntryCodeMessage already work on the client side.
  async sendMessage(washId: string, type: WhatsAppMessageType, extra?: { origin?: string }) {
    const wash = await prisma.wash.findUnique({
      where: { id: washId },
      include: {
        customer: true,
        vehicle: true,
        tenant: true,
      },
    });

    if (!wash) {
      throw new Error('Atendimento não encontrado');
    }

    const { customer, vehicle, tenant } = wash;

    let messageText: string;
    if (type === 'ENTRY_CODE') {
      messageText = buildEntryCodeMessage(customer.name, vehicle.model, vehicle.plate, wash.pickupCode);
    } else if (type === 'TRACKING') {
      const origin = extra?.origin || '';
      const trackingUrl = wash.trackingToken ? `${origin}/acompanhar/${wash.trackingToken}` : origin;
      messageText = buildTrackingMessage(tenant?.whatsappTrackingTemplate, customer.name, vehicle.model, vehicle.plate, trackingUrl);
    } else {
      // READY — tenant.whatsappMessageTemplate is the source of truth (matches /api/settings);
      // the legacy single-tenant Settings row is only a fallback for the rare wash whose tenant record is missing.
      let template: string | undefined = tenant?.whatsappMessageTemplate;
      if (!template) {
        const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
        template = settings?.whatsappMessageTemplate;
      }
      messageText = buildReadyMessage(template, customer.name, vehicle.model, vehicle.plate, wash.pickupCode);
    }

    // Meta WhatsApp Cloud API credentials
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const cleanedPhone = customer.phone.replace(/\D/g, '');
    let status = 'SENT';
    let externalMessageId: string | null = null;
    let errorMsg: string | null = null;
    let isWebFallback = false;

    if (token && phoneId) {
      // Send via official Meta Cloud API
      try {
        const response = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanedPhone,
            type: 'text',
            text: { body: messageText },
          }),
        });

        const data = await response.json();

        if (response.ok) {
          externalMessageId = data.messages?.[0]?.id || null;
          status = 'DELIVERED';
        } else {
          status = 'FAILED';
          errorMsg = data.error?.message || 'Erro na API do WhatsApp';
        }
      } catch (err: unknown) {
        status = 'FAILED';
        errorMsg = err instanceof Error ? err.message : 'Erro de conexão com API';
      }
    } else {
      // Fallback: system generates wa.me link for browser direct send
      isWebFallback = true;
      status = 'SENT';
    }

    // Record in DB
    const log = await prisma.whatsAppMessage.create({
      data: {
        tenantId: wash.tenantId,
        customerId: customer.id,
        washId: wash.id,
        phone: customer.phone,
        message: messageText,
        type,
        status,
        externalMessageId,
        error: errorMsg,
        sentAt: new Date(),
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
      },
    });

    const webLink = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(messageText)}`;

    return {
      success: status !== 'FAILED',
      messageLog: log,
      isWebFallback,
      webLink,
      messageText,
    };
  },
};
