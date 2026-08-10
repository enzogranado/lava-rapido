import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/services — List all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const services = await prisma.service.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// POST /api/services — Create a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, active } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { name, description, price: parseFloat(price), active: active !== false },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
