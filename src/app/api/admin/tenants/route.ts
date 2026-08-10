import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/tenants — List all Lava Rápidos and platform metrics for Super Admin
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores do sistema.' }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            customers: true,
            vehicles: true,
            washes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate revenue metrics per tenant
    const tenantsWithMetrics = await Promise.all(
      tenants.map(async (t) => {
        // Month revenue
        const monthAgg = await prisma.wash.aggregate({
          where: {
            tenantId: t.id,
            status: 'DELIVERED',
            createdAt: { gte: startOfMonth },
          },
          _sum: { total: true },
          _count: { _all: true },
        });

        // Week revenue
        const weekAgg = await prisma.wash.aggregate({
          where: {
            tenantId: t.id,
            status: 'DELIVERED',
            createdAt: { gte: startOfWeek },
          },
          _sum: { total: true },
        });

        // Total all-time revenue
        const totalAgg = await prisma.wash.aggregate({
          where: {
            tenantId: t.id,
            status: 'DELIVERED',
          },
          _sum: { total: true },
        });

        const ownerUser = t.users.find((u) => u.role === 'TENANT_ADMIN') || t.users[0];

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          phone: t.phone,
          email: t.email || ownerUser?.email,
          ownerName: ownerUser?.name || 'N/A',
          active: t.active,
          createdAt: t.createdAt,
          counts: {
            customers: t._count.customers,
            vehicles: t._count.vehicles,
            washes: t._count.washes,
          },
          revenueMonth: monthAgg._sum.total || 0,
          washesMonth: monthAgg._count._all || 0,
          revenueWeek: weekAgg._sum.total || 0,
          revenueTotal: totalAgg._sum.total || 0,
        };
      })
    );

    // Global Platform Totals
    const platformTotalTenants = tenantsWithMetrics.length;
    const platformActiveTenants = tenantsWithMetrics.filter((t) => t.active).length;
    const platformTotalRevenueMonth = tenantsWithMetrics.reduce((sum, t) => sum + t.revenueMonth, 0);
    const platformTotalWashesMonth = tenantsWithMetrics.reduce((sum, t) => sum + t.washesMonth, 0);
    const platformTotalRevenueAllTime = tenantsWithMetrics.reduce((sum, t) => sum + t.revenueTotal, 0);

    return NextResponse.json({
      summary: {
        totalTenants: platformTotalTenants,
        activeTenants: platformActiveTenants,
        revenueMonth: platformTotalRevenueMonth,
        washesMonth: platformTotalWashesMonth,
        revenueTotal: platformTotalRevenueAllTime,
      },
      tenants: tenantsWithMetrics,
    });
  } catch (error) {
    console.error('Error fetching admin tenants:', error);
    return NextResponse.json({ error: 'Falha ao carregar lista de lava-rápidos' }, { status: 500 });
  }
}

// PATCH /api/admin/tenants — Toggle Tenant active status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { tenantId, active } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { active },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) {
    console.error('Error updating tenant active state:', error);
    return NextResponse.json({ error: 'Falha ao atualizar status do lava-rápido' }, { status: 500 });
  }
}
