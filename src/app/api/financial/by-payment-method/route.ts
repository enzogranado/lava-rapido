import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

const PAYMENT_METHOD_METADATA: Record<string, { label: string; color: string; icon: string }> = {
  PIX: { label: 'PIX', color: '#06b6d4', icon: 'Zap' },
  CREDIT: { label: 'Cartão de Crédito', color: '#a855f7', icon: 'CreditCard' },
  DEBIT: { label: 'Cartão de Débito', color: '#38bdf8', icon: 'CreditCard' },
  MONEY: { label: 'Dinheiro', color: '#22c55e', icon: 'Banknote' },
  MENSALISTA: { label: 'Faturado / Mensalista', color: '#6366f1', icon: 'Repeat' },
  OTHER: { label: 'Outro / Não Informado', color: '#94a3b8', icon: 'Layers' },
};

// GET /api/financial/by-payment-method — Aggregated payment methods report
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 1d, 7d, 30d, 3m, 6m, 1y, all

    const now = new Date();
    let startDate: Date | undefined = new Date();
    const isDaily = range === '1d' || range === 'today';

    if (isDaily) {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (range === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (range === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (range === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (range === 'all') {
      startDate = undefined;
    }

    const washes = await prisma.wash.findMany({
      where: {
        tenantId,
        status: 'DELIVERED',
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: {
        id: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { model: true, plate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = washes.reduce((sum, w) => sum + w.total, 0);
    const totalCount = washes.length;

    // Group by payment method
    const methodGroups: Record<string, { count: number; revenue: number }> = {
      PIX: { count: 0, revenue: 0 },
      CREDIT: { count: 0, revenue: 0 },
      DEBIT: { count: 0, revenue: 0 },
      MONEY: { count: 0, revenue: 0 },
      MENSALISTA: { count: 0, revenue: 0 },
      OTHER: { count: 0, revenue: 0 },
    };

    washes.forEach((w) => {
      const rawMethod = w.paymentMethod ? w.paymentMethod.toUpperCase() : 'OTHER';
      const key = methodGroups[rawMethod] ? rawMethod : 'OTHER';
      methodGroups[key].count += 1;
      methodGroups[key].revenue += w.total;
    });

    const methods = Object.entries(methodGroups)
      .map(([key, data]) => {
        const meta = PAYMENT_METHOD_METADATA[key] || PAYMENT_METHOD_METADATA.OTHER;
        const percentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
        const countPercentage = totalCount > 0 ? (data.count / totalCount) * 100 : 0;
        const ticketMedio = data.count > 0 ? data.revenue / data.count : 0;

        return {
          id: key,
          label: meta.label,
          color: meta.color,
          icon: meta.icon,
          count: data.count,
          countPercentage: Number(countPercentage.toFixed(1)),
          revenue: Number(data.revenue.toFixed(2)),
          percentage: Number(percentage.toFixed(1)),
          ticketMedio: Number(ticketMedio.toFixed(2)),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const topMethod = methods[0] || null;

    // Recent payments for transaction ledger
    const recentPayments = washes.slice(0, 50).map((w) => ({
      id: w.id,
      customerName: w.customer.name,
      customerPhone: w.customer.phone,
      vehicleModel: w.vehicle.model,
      vehiclePlate: w.vehicle.plate,
      amount: w.total,
      paymentMethod: w.paymentMethod || 'OTHER',
      createdAt: w.createdAt,
    }));

    return NextResponse.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCount,
      overallTicketMedio: totalCount > 0 ? Number((totalRevenue / totalCount).toFixed(2)) : 0,
      topMethod,
      methods,
      recentPayments,
    });
  } catch (error) {
    console.error('Error fetching payment method report:', error);
    return NextResponse.json({ error: 'Failed to fetch payment method report' }, { status: 500 });
  }
}
