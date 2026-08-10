import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/financial/revenue — Revenue data over time and summary stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 3m, 6m, 1y

    const now = new Date();
    let startDate = new Date();

    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '3m') startDate.setMonth(now.getMonth() - 3);
    else if (range === '6m') startDate.setMonth(now.getMonth() - 6);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);

    startDate.setHours(0, 0, 0, 0);

    const washes = await prisma.wash.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: startDate },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date with continuous range initialized to zero
    const dailyMap: Record<string, { revenue: number; count: number }> = {};
    const curr = new Date(startDate);
    while (curr <= now) {
      const dateStr = curr.toISOString().split('T')[0];
      dailyMap[dateStr] = { revenue: 0, count: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    washes.forEach((w) => {
      const dateStr = new Date(w.createdAt).toISOString().split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].revenue += w.total;
        dailyMap[dateStr].count += 1;
      }
    });

    // Format for charts
    const chartData = Object.entries(dailyMap).map(([date, data]) => {
      const d = new Date(date + 'T00:00:00');
      const dateFormatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return {
        date: dateFormatted,
        rawDate: date,
        revenue: Number(data.revenue.toFixed(2)),
        count: data.count,
        ticketMedio: data.count > 0 ? Number((data.revenue / data.count).toFixed(2)) : 0,
      };
    });

    const totalRevenue = washes.reduce((sum, w) => sum + w.total, 0);
    const totalCount = washes.length;
    const overallTicketMedio = totalCount > 0 ? totalRevenue / totalCount : 0;

    return NextResponse.json({
      chartData,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCount,
      overallTicketMedio: Number(overallTicketMedio.toFixed(2)),
    });
  } catch (error) {
    console.error('Error fetching financial revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}

