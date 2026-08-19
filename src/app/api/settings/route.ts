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
        businessType: tenant.businessType || 'HIBRIDO',
        inactiveDaysLimit: tenant.inactiveDaysLimit,
        whatsappMessageTemplate: tenant.whatsappMessageTemplate,
        whatsappRecallTemplate: tenant.whatsappRecallTemplate,
        whatsappTrackingTemplate: tenant.whatsappTrackingTemplate,
        whatsappParkingTemplate: tenant.whatsappParkingTemplate,
        parkingHourlyRate: tenant.parkingHourlyRate,
        parkingAdditionalHourlyRate: tenant.parkingAdditionalHourlyRate,
        parkingDailyRate: tenant.parkingDailyRate,
        parkingGraceMinutes: tenant.parkingGraceMinutes,
        parkingSpots: tenant.parkingSpots,
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
    const {
      businessName,
      businessType,
      inactiveDaysLimit,
      whatsappMessageTemplate,
      whatsappRecallTemplate,
      whatsappTrackingTemplate,
      whatsappParkingTemplate,
      parkingHourlyRate,
      parkingAdditionalHourlyRate,
      parkingDailyRate,
      parkingGraceMinutes,
      parkingSpots,
    } = body;

    const parsedInactiveDays = inactiveDaysLimit !== undefined ? Number.parseInt(String(inactiveDaysLimit), 10) : undefined;
    const safeInactiveDays = (parsedInactiveDays !== undefined && !Number.isNaN(parsedInactiveDays)) ? parsedInactiveDays : undefined;

    const updateTenantData: any = {};
    if (businessName !== undefined && businessName !== null) updateTenantData.name = String(businessName);
    if (businessType && ['LAVA_RAPIDO', 'ESTACIONAMENTO', 'HIBRIDO'].includes(businessType)) updateTenantData.businessType = businessType;
    if (safeInactiveDays !== undefined) updateTenantData.inactiveDaysLimit = safeInactiveDays;
    if (whatsappMessageTemplate !== undefined && whatsappMessageTemplate !== null) updateTenantData.whatsappMessageTemplate = String(whatsappMessageTemplate);
    if (whatsappRecallTemplate !== undefined && whatsappRecallTemplate !== null) updateTenantData.whatsappRecallTemplate = String(whatsappRecallTemplate);
    if (whatsappTrackingTemplate !== undefined && whatsappTrackingTemplate !== null) updateTenantData.whatsappTrackingTemplate = String(whatsappTrackingTemplate);
    if (whatsappParkingTemplate !== undefined && whatsappParkingTemplate !== null) updateTenantData.whatsappParkingTemplate = String(whatsappParkingTemplate);
    if (parkingHourlyRate !== undefined) updateTenantData.parkingHourlyRate = parseFloat(parkingHourlyRate) || 10;
    if (parkingAdditionalHourlyRate !== undefined) updateTenantData.parkingAdditionalHourlyRate = parseFloat(parkingAdditionalHourlyRate) || 5;
    if (parkingDailyRate !== undefined) updateTenantData.parkingDailyRate = parseFloat(parkingDailyRate) || 50;
    if (parkingGraceMinutes !== undefined) updateTenantData.parkingGraceMinutes = parseInt(parkingGraceMinutes, 10) || 15;
    if (parkingSpots !== undefined) updateTenantData.parkingSpots = parseInt(parkingSpots, 10) || 30;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (tenant) {
      let updatedTenant: any;
      try {
        updatedTenant = await prisma.tenant.update({
          where: { id: tenantId },
          data: updateTenantData,
        });
      } catch (err: any) {
        if (err?.message?.includes('whatsappRecallTemplate') && updateTenantData.whatsappRecallTemplate) {
          delete updateTenantData.whatsappRecallTemplate;
          updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateTenantData,
          });
        } else if (err?.message?.includes('whatsappTrackingTemplate') && updateTenantData.whatsappTrackingTemplate) {
          delete updateTenantData.whatsappTrackingTemplate;
          updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateTenantData,
          });
        } else {
          throw err;
        }
      }

      return NextResponse.json({
        id: updatedTenant.id,
        businessName: updatedTenant.name,
        inactiveDaysLimit: updatedTenant.inactiveDaysLimit,
        whatsappMessageTemplate: updatedTenant.whatsappMessageTemplate,
        whatsappRecallTemplate: updatedTenant.whatsappRecallTemplate || whatsappRecallTemplate,
        whatsappTrackingTemplate: updatedTenant.whatsappTrackingTemplate || whatsappTrackingTemplate,
      });
    }

    const updateSettingsData: any = {};
    if (businessName !== undefined && businessName !== null) updateSettingsData.businessName = String(businessName);
    if (safeInactiveDays !== undefined) updateSettingsData.inactiveDaysLimit = safeInactiveDays;
    if (whatsappMessageTemplate !== undefined && whatsappMessageTemplate !== null) updateSettingsData.whatsappMessageTemplate = String(whatsappMessageTemplate);
    if (whatsappRecallTemplate !== undefined && whatsappRecallTemplate !== null) updateSettingsData.whatsappRecallTemplate = String(whatsappRecallTemplate);

    let settings: any;
    try {
      settings = await prisma.settings.upsert({
        where: { id: 'default' },
        update: updateSettingsData,
        create: {
          id: 'default',
          businessName: String(businessName || 'LavaFlow'),
          inactiveDaysLimit: safeInactiveDays ?? 45,
          whatsappMessageTemplate: String(whatsappMessageTemplate || 'Olá, {nome}!'),
          whatsappRecallTemplate: String(whatsappRecallTemplate || 'Olá, {nome}!'),
        },
      });
    } catch (err: any) {
      if (err?.message?.includes('whatsappRecallTemplate')) {
        delete updateSettingsData.whatsappRecallTemplate;
        settings = await prisma.settings.upsert({
          where: { id: 'default' },
          update: updateSettingsData,
          create: {
            id: 'default',
            businessName: String(businessName || 'LavaFlow'),
            inactiveDaysLimit: safeInactiveDays ?? 45,
            whatsappMessageTemplate: String(whatsappMessageTemplate || 'Olá, {nome}!'),
          },
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 });
  }
}
