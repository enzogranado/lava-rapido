import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/settings — Retrieve system settings for current tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant) {
      return NextResponse.json({
        id: tenant.id,
        businessName: tenant.name,
        inactiveDaysLimit: tenant.inactiveDaysLimit,
        whatsappMessageTemplate: tenant.whatsappMessageTemplate,
        pendingPinChange: tenant.pendingPinChange,
        pinChangeStatus: tenant.pinChangeStatus,
      });
    }

    let settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default', businessName: 'LavaFlow', inactiveDaysLimit: 45 },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings — Update settings for current tenant
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, inactiveDaysLimit, whatsappMessageTemplate } = body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(businessName && { name: businessName }),
        ...(inactiveDaysLimit !== undefined && { inactiveDaysLimit: parseInt(inactiveDaysLimit, 10) }),
        ...(whatsappMessageTemplate !== undefined && { whatsappMessageTemplate }),
      },
    });

    return NextResponse.json({
      id: updatedTenant.id,
      businessName: updatedTenant.name,
      inactiveDaysLimit: updatedTenant.inactiveDaysLimit,
      whatsappMessageTemplate: updatedTenant.whatsappMessageTemplate,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
