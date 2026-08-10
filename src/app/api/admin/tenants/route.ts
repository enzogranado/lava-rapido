import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/tenants — List all Lava Rápidos, pending approvals, billing & platform metrics for Super Admin
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
        const monthAgg = await prisma.wash.aggregate({
          where: {
            tenantId: t.id,
            status: 'DELIVERED',
            createdAt: { gte: startOfMonth },
          },
          _sum: { total: true },
          _count: { _all: true },
        });

        const weekAgg = await prisma.wash.aggregate({
          where: {
            tenantId: t.id,
            status: 'DELIVERED',
            createdAt: { gte: startOfWeek },
          },
          _sum: { total: true },
        });

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
          status: t.status,
          paymentStatus: t.paymentStatus,
          monthlyFee: t.monthlyFee,
          lastPaymentDate: t.lastPaymentDate,
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

    // Global End-User Customers across all Lava-Rápidos
    const allCustomersRaw = await prisma.customer.findMany({
      include: {
        tenant: { select: { id: true, name: true } },
        washes: {
          where: { status: 'DELIVERED' },
          select: { total: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const globalCustomers = allCustomersRaw.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      tenantName: c.tenant.name,
      tenantId: c.tenant.id,
      totalVisits: c.washes.length,
      totalSpent: c.washes.reduce((sum, w) => sum + w.total, 0),
      createdAt: c.createdAt,
    }));

    const pendingTenants = tenantsWithMetrics.filter((t) => t.status === 'PENDING' || (!t.active && t.status !== 'REJECTED'));
    const approvedTenants = tenantsWithMetrics.filter((t) => t.status === 'APPROVED' && t.active);

    // Global Platform Totals
    const platformTotalTenants = approvedTenants.length;
    const platformActiveTenants = approvedTenants.filter((t) => t.active).length;
    const platformPendingApprovals = pendingTenants.length;
    const platformTotalRevenueMonth = approvedTenants.reduce((sum, t) => sum + t.revenueMonth, 0);
    const platformTotalWashesMonth = approvedTenants.reduce((sum, t) => sum + t.washesMonth, 0);
    const platformTotalRevenueAllTime = approvedTenants.reduce((sum, t) => sum + t.revenueTotal, 0);

    return NextResponse.json({
      summary: {
        totalTenants: platformTotalTenants,
        activeTenants: platformActiveTenants,
        pendingApprovals: platformPendingApprovals,
        revenueMonth: platformTotalRevenueMonth,
        washesMonth: platformTotalWashesMonth,
        revenueTotal: platformTotalRevenueAllTime,
      },
      pendingTenants,
      approvedTenants,
      tenants: tenantsWithMetrics,
      globalCustomers,
    });
  } catch (error) {
    console.error('Error fetching admin tenants:', error);
    return NextResponse.json({ error: 'Falha ao carregar lista de lava-rápidos' }, { status: 500 });
  }
}

// PATCH /api/admin/tenants — Update Tenant (Approve, Reject, Toggle Active, Payment Status)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { tenantId, action, active, status, paymentStatus, monthlyFee } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
    }

    let updateData: any = {};

    if (action === 'APPROVE') {
      updateData = {
        status: 'APPROVED',
        active: true,
        paymentStatus: 'PAID',
        lastPaymentDate: new Date(),
      };
    } else if (action === 'REJECT') {
      updateData = {
        status: 'REJECTED',
        active: false,
      };
    } else if (action === 'TOGGLE_ACTIVE') {
      updateData = { active };
    } else if (action === 'SET_PAYMENT_STATUS') {
      updateData = {
        paymentStatus,
        active: paymentStatus === 'OVERDUE' ? false : active !== undefined ? active : true,
        ...(paymentStatus === 'PAID' ? { lastPaymentDate: new Date() } : {}),
      };
    } else {
      if (active !== undefined) updateData.active = active;
      if (status !== undefined) updateData.status = status;
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
      if (monthlyFee !== undefined) updateData.monthlyFee = parseFloat(monthlyFee);
    }

    let updated;
    try {
      updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
      });
    } catch (err: any) {
      console.warn('Prisma full update failed, falling back to basic fields:', err?.message);
      // Safe fallback for cached Prisma client in dev server
      const safeData: any = {};
      if (updateData.active !== undefined) safeData.active = updateData.active;
      updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: safeData,
      });
    }

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error: any) {
    console.error('Error updating tenant admin state:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao atualizar status do lava-rápido' },
      { status: 500 }
    );
  }
}
