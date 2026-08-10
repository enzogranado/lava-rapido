import prisma from '@/lib/prisma';

export const whatsappService = {
  async sendReadyNotification(washId: string) {
    const wash = await prisma.wash.findUnique({
      where: { id: washId },
      include: {
        customer: true,
        vehicle: true,
        whatsappMessages: true,
      },
    });

    if (!wash) {
      throw new Error('Atendimento não encontrado');
    }

    const { customer, vehicle } = wash;

    // Retrieve system settings for template
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    const template = settings?.whatsappMessageTemplate || 
      'Olá, {nome}! 🚗✨\n\nSeu {modelo} — placa {placa} — ficou pronto e já está disponível para retirada.\n\nObrigado por confiar em nosso lava-rápido! 🚿';

    const messageText = template
      .replace('{nome}', customer.name)
      .replace('{modelo}', vehicle.model)
      .replace('{placa}', vehicle.plate);

    // Meta WhatsApp Cloud API credentials
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const cleanedPhone = customer.phone.replace(/\D/g, '');
    let status = 'SENT';
    let externalMessageId = null;
    let errorMsg = null;
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
        customerId: customer.id,
        washId: wash.id,
        phone: customer.phone,
        message: messageText,
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
