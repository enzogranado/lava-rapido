import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/financial/by-service — Revenue per service breakdown
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    let startDate = new Date();

    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '3m') startDate.setMonth(now.getMonth() - 3);
    else if (range === '6m') startDate.setMonth(now.getMonth() - 6);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);

    const items = await prisma.washItem.findMany({
      where: {
        wash: {
          status: 'DELIVERED',
          createdAt: { gte: startDate },
        },
      },
      select: {
        serviceNameSnapshot: true,
        quantity: true,
        total: true,
      },
    });

    const breakdownMap: Record<string, { serviceName: string; quantity: number; revenue: number }> = {};

    items.forEach((item) => {
      const key = item.serviceNameSnapshot;
      if (!breakdownMap[key]) {
        breakdownMap[key] = { serviceName: key, quantity: 0, revenue: 0 };
      }
      breakdownMap[key].quantity += item.quantity;
      breakdownMap[key].revenue += item.total;
    });

    const breakdown = Object.values(breakdownMap).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error fetching revenue by service:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue by service' }, { status: 500 });
  }
}
