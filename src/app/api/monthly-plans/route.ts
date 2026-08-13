import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantIdOrFallback } from '@/lib/auth';

// GET /api/monthly-plans — List monthly subscription plans scoped to tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const plans = await prisma.monthlyPlan.findMany({
      where: {
        tenantId,
        ...(activeOnly ? { active: true } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching monthly plans:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly plans' }, { status: 500 });
  }
}

// POST /api/monthly-plans — Create a new monthly subscription plan scoped to tenant
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdOrFallback(request);
    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const { name, description, price, washesIncluded, active } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
    }

    const plan = await prisma.monthlyPlan.create({
      data: {
        tenantId,
        name,
        description,
        price: parseFloat(price),
        washesIncluded: washesIncluded === '' || washesIncluded === null || washesIncluded === undefined
          ? null
          : parseInt(washesIncluded, 10),
        active: active !== false,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating monthly plan:', error);
    return NextResponse.json({ error: 'Failed to create monthly plan' }, { status: 500 });
  }
}
