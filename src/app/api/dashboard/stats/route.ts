import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/dashboard/stats — Comprehensive stats for Dashboard scoped to current Tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Settings for inactive threshold
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const inactiveLimitDays = tenant?.inactiveDaysLimit || 45;
    const inactiveThreshold = new Date(now.getTime() - inactiveLimitDays * 24 * 60 * 60 * 1000);

    // 1. Total counts
    const totalCustomers = await prisma.customer.count({ where: { tenantId } });
    const totalVehicles = await prisma.vehicle.count({ where: { tenantId } });

    // 2. Washes today
    const washesToday = await prisma.wash.count({
      where: {
        tenantId,
        createdAt: { gte: startOfToday },
        status: { not: 'CANCELLED' },
      },
    });

    // 3. Washes this month (período)
    const washesMonth = await prisma.wash.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
        status: { not: 'CANCELLED' },
      },
    });

    // 4. Customers served today (unique)
    const customersTodayRaw = await prisma.wash.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        createdAt: { gte: startOfToday },
        status: { not: 'CANCELLED' },
      },
    });
    const customersToday = customersTodayRaw.length;

    // 5. Recurrent vs Inactive customers
    const washesPerCustomer = await prisma.wash.groupBy({
      by: ['customerId'],
      where: { tenantId, status: { not: 'CANCELLED' } },
      _count: { _all: true },
    });

    const recurrentCustomerIds = washesPerCustomer
      .filter((item) => item._count._all >= 3)
      .map((item) => item.customerId);
    const recurrentCustomersCount = recurrentCustomerIds.length;

    // Inactive: last visit before inactiveThreshold
    const allCustomers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        washes: {
          where: { tenantId, status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const inactiveCustomersList = allCustomers
      .filter((c) => {
        if (c.washes.length === 0) return true;
        const lastVisit = c.washes[0].createdAt;
        return lastVisit < inactiveThreshold;
      })
      .map((c) => {
        const lastVisit = c.washes.length > 0 ? c.washes[0].createdAt : null;
        const daysWithoutVisit = lastVisit
          ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          lastVisit,
          daysWithoutVisit,
        };
      })
      .sort((a, b) => (b.daysWithoutVisit || 999) - (a.daysWithoutVisit || 999));

    const inactiveCustomersCount = inactiveCustomersList.length;

    // 6. Revenue calculations
    const revenueTodayAgg = await prisma.wash.aggregate({
      where: {
        tenantId,
        status: 'DELIVERED',
        deliveredAt: { gte: startOfToday },
      },
      _sum: { total: true },
    });
    const revenueToday = revenueTodayAgg._sum.total || 0;

    const revenueWeekAgg = await prisma.wash.aggregate({
      where: {
        tenantId,
        status: 'DELIVERED',
        deliveredAt: { gte: startOfWeek },
      },
      _sum: { total: true },
    });
    const revenueWeek = revenueWeekAgg._sum.total || 0;

    const revenueMonthAgg = await prisma.wash.aggregate({
      where: {
        tenantId,
        status: 'DELIVERED',
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
      _count: { _all: true },
    });
    const revenueMonth = revenueMonthAgg._sum.total || 0;
    const countMonthWashes = revenueMonthAgg._count._all || 0;
    const ticketMedioMonth = countMonthWashes > 0 ? revenueMonth / countMonthWashes : 0;

    const avgVisitsPerCustomer = totalCustomers > 0 ? (washesMonth / totalCustomers).toFixed(1) : '0.0';

    return NextResponse.json({
      tenantName: tenant?.name || 'Lava Rápido',
      totalCustomers,
      totalVehicles,
      washesToday,
      washesMonth,
      customersToday,
      recurrentCustomersCount,
      inactiveCustomersCount,
      revenueToday,
      revenueWeek,
      revenueMonth,
      countMonthWashes,
      ticketMedioMonth,
      avgVisitsPerCustomer,
      inactiveCustomersList: inactiveCustomersList.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

