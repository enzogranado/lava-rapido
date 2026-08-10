import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings — Retrieve system settings
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default', businessName: 'Meu Lava Rápido', inactiveDaysLimit: 45 },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings — Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, inactiveDaysLimit, whatsappMessageTemplate } = body;

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        ...(businessName && { businessName }),
        ...(inactiveDaysLimit !== undefined && { inactiveDaysLimit: parseInt(inactiveDaysLimit, 10) }),
        ...(whatsappMessageTemplate !== undefined && { whatsappMessageTemplate }),
      },
      create: {
        id: 'default',
        businessName: businessName || 'Meu Lava Rápido',
        inactiveDaysLimit: parseInt(inactiveDaysLimit, 10) || 45,
        whatsappMessageTemplate,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
