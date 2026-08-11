import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    if (user.tenant) {
      if (user.tenant.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Seu cadastro está em análise pela equipe administradora. Aguarde a aprovação.' },
          { status: 403 }
        );
      }

      if (user.tenant.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'Seu cadastro foi recusado pela administração. Entre em contato com o suporte.' },
          { status: 403 }
        );
      }

      if (!user.tenant.active || user.tenant.paymentStatus === 'OVERDUE') {
        return NextResponse.json(
          { error: 'Acesso suspenso por pendência financeira ou bloqueio administrativo. Fale com a administração.' },
          { status: 403 }
        );
      }
    }

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration
    const sessionPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role as any,
      tenantName: user.tenant?.name || 'Sistema',
      expiresAt,
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Falha ao realizar login' }, { status: 500 });
  }
}
