import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { businessName, ownerName, email, password, phone, dashboardPin } = await request.json();

    if (!businessName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    const cleanPin = dashboardPin && String(dashboardPin).trim().length === 4 ? String(dashboardPin).trim() : '1234';
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json({ error: 'Por favor, informe um endereço de e-mail válido (ex: seuemail@dominio.com).' }, { status: 400 });
    }

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
    
    const uniqueHash = Date.now().toString(36);
    const slug = `${baseSlug || 'lavarapido'}-${uniqueHash}`;

    // 1. Create Tenant (Pending Approval)
    let tenant;
    try {
      tenant = await prisma.tenant.create({
        data: {
          name: businessName,
          slug,
          phone: phone || null,
          email: cleanEmail,
          dashboardPin: cleanPin,
          active: false,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          monthlyFee: 99.0,
        },
      });
    } catch (err: any) {
      // Fallback if client hasn't reloaded schema in memory
      tenant = await prisma.tenant.create({
        data: {
          name: businessName,
          slug,
          phone: phone || null,
          email: cleanEmail,
          dashboardPin: cleanPin,
          active: false,
        },
      });
    }

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
      { name: 'Lavagem Carro Pequeno', description: 'Lavagem completa para carros de pequeno porte (hatch/sedã compacto).', price: 50.0 },
      { name: 'Lavagem Carro Grande', description: 'Lavagem completa para carros de grande porte (SUVs/Pickups).', price: 90.0 },
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

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: 'Cadastro realizado com sucesso! Sua solicitação foi enviada para aprovação do Administrador.',
    });
  } catch (error: any) {
    console.error('Error registering new tenant:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este e-mail ou lava-rápido já possui um cadastro no sistema.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Falha ao cadastrar lava-rápido' },
      { status: 500 }
    );
  }
}
