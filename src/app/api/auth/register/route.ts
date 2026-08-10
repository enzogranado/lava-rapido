import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { businessName, ownerName, email, password, phone } = await request.json();

    if (!businessName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 });
    }

    // Generate unique slug for tenant
    const baseSlug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    const randomNum = Math.floor(Math.random() * 1000);
    const slug = `${baseSlug || 'lavarapido'}-${randomNum}`;

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        slug,
        phone: phone || null,
        email: cleanEmail,
        active: true,
      },
    });

    // 2. Create Tenant Admin User
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: ownerName,
        email: cleanEmail,
        password: hashPassword(password),
        role: 'TENANT_ADMIN',
      },
    });

    // 3. Seed default standard services for this new Tenant
    const defaultServices = [
      { name: 'Lavagem Simples', description: 'Lavagem externa rápida com shampoo automotivo.', price: 40.0 },
      { name: 'Lavagem Completa', description: 'Lavagem externa + limpeza interna detalhada.', price: 80.0 },
      { name: 'Lavagem Premium', description: 'Lavagem completa + cera + acabamento vip.', price: 120.0 },
      { name: 'Higienização Interna', description: 'Limpeza profunda com aspiração e higienizador.', price: 120.0 },
      { name: 'Enceramento', description: 'Aplicação de cera protetora com brilho intenso.', price: 30.0 },
      { name: 'Polimento', description: 'Polimento técnico e restauração de pintura.', price: 200.0 },
    ];

    for (const svc of defaultServices) {
      await prisma.service.create({
        data: {
          tenantId: tenant.id,
          name: svc.name,
          description: svc.description,
          price: svc.price,
          active: true,
        },
      });
    }

    const sessionPayload = {
      userId: user.id,
      tenantId: tenant.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      tenantName: tenant.name,
    };

    const token = createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error registering new tenant:', error);
    return NextResponse.json({ error: 'Falha ao cadastrar lava-rápido' }, { status: 500 });
  }
}
