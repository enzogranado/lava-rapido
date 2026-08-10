import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = 'lava_rapido_secure_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database with Multi-Tenant accounts and realistic history...');

  // Clean existing tables
  await prisma.washItem.deleteMany();
  await prisma.wash.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.settings.deleteMany();

  // 1. Settings
  await prisma.settings.create({
    data: {
      id: 'default',
      businessName: 'Meu Lava Rápido',
      inactiveDaysLimit: 45,
    },
  });

  // 2. Create Super Admin User
  await prisma.user.create({
    data: {
      id: 'super-admin-1',
      tenantId: null,
      name: 'Super Administrador',
      email: 'admin@sistema.com',
      password: hashPassword('Seed@2026'),
      role: 'SUPER_ADMIN',
    },
  });

  // 3. Create 3 Distinct Tenants (Lava Rápidos)
  const tenantsConfig = [
    {
      name: 'Lava Rápido Express',
      slug: 'lava-rapido-express',
      email: 'express@lavarapido.com',
      ownerName: 'Ricardo Express',
      phone: '+5511988880001',
      days: 60,
    },
    {
      name: 'Auto Spa Premium',
      slug: 'auto-spa-premium',
      email: 'premium@lavarapido.com',
      ownerName: 'Juliana Premium',
      phone: '+5511977770002',
      days: 60,
    },
    {
      name: 'Lava Jato Central',
      slug: 'lava-jato-central',
      email: 'central@lavarapido.com',
      ownerName: 'Marcos Central',
      phone: '+5511966660003',
      days: 45,
    },
  ];

  const servicesTemplate = [
    { name: 'Lavagem Carro Pequeno', description: 'Lavagem completa para carros de pequeno porte (hatch/sedã compacto).', price: 50.0 },
    { name: 'Lavagem Carro Grande', description: 'Lavagem completa para carros de grande porte (SUVs/Pickups).', price: 90.0 },
    { name: 'Lavagem Simples', description: 'Lavagem externa com shampoo neutro.', price: 40.0 },
    { name: 'Lavagem Completa', description: 'Lavagem externa + limpeza interna.', price: 80.0 },
    { name: 'Lavagem Premium', description: 'Completa + cera líquida + acabamento vip.', price: 120.0 },
    { name: 'Higienização Interna', description: 'Higienização e aspiração profunda.', price: 130.0 },
    { name: 'Enceramento', description: 'Aplicação de cera protetora.', price: 35.0 },
    { name: 'Polimento Técnico', description: 'Polimento para risco e brilho.', price: 220.0 },
  ];

  const now = new Date();
  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (const tConfig of tenantsConfig) {
    console.log(`\n🏢 Creating Tenant: ${tConfig.name}...`);
    
    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tConfig.name,
        slug: tConfig.slug,
        email: tConfig.email,
        phone: tConfig.phone,
        active: true,
        status: 'APPROVED',
        paymentStatus: 'PAID',
        monthlyFee: 99.0,
      },
    });

    // Create Tenant Owner User
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: tConfig.ownerName,
        email: tConfig.email,
        password: hashPassword('Seed@2026'),
        role: 'TENANT_ADMIN',
      },
    });

    // Create Services
    const tenantServices = [];
    for (const st of servicesTemplate) {
      const priceMultiplier = tConfig.slug.includes('premium') ? 1.3 : 1.0;
      const s = await prisma.service.create({
        data: {
          tenantId: tenant.id,
          name: st.name,
          description: st.description,
          price: Math.round(st.price * priceMultiplier),
          active: true,
        },
      });
      tenantServices.push(s);
    }

    // Create Customers & Vehicles
    const tenantCustomers = [
      { name: `João Silva (${tConfig.name.split(' ')[0]})`, phone: `+551199${getRandomInt(1000, 9999)}001` },
      { name: `Maria Santos (${tConfig.name.split(' ')[0]})`, phone: `+551199${getRandomInt(1000, 9999)}002` },
      { name: `Pedro Oliveira`, phone: `+551199${getRandomInt(1000, 9999)}003` },
      { name: `Ana Costa`, phone: `+551199${getRandomInt(1000, 9999)}004` },
      { name: `Carlos Ferreira`, phone: `+551199${getRandomInt(1000, 9999)}005` },
      { name: `Fernanda Lima`, phone: `+551199${getRandomInt(1000, 9999)}006` },
    ];

    const dbVehicles = [];
    for (let cIdx = 0; cIdx < tenantCustomers.length; cIdx++) {
      const cData = tenantCustomers[cIdx];
      const customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: cData.name,
          phone: cData.phone,
          notes: 'Cliente cadastrado',
        },
      });

      const models = ['Honda HR-V', 'Toyota Corolla', 'Hyundai HB20', 'Jeep Compass', 'Chevrolet Onix', 'VW Polo'];
      const vehicle = await prisma.vehicle.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          model: getRandom(models),
          plate: `${tConfig.slug.substring(0, 2).toUpperCase()}${getRandomInt(100, 999)}${cIdx}`,
          color: getRandom(['Branco', 'Preto', 'Prata', 'Cinza']),
        },
      });
      dbVehicles.push(vehicle);
    }

    // Generate washes history sequentially
    let tenantWashCount = 0;

    for (let dayOffset = tConfig.days; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = targetDate.getDay();

      const dailyWashCount = dayOfWeek === 0 || dayOfWeek === 6 ? getRandomInt(2, 4) : getRandomInt(1, 3);

      for (let w = 0; w < dailyWashCount; w++) {
        const vehicle = getRandom(dbVehicles);
        const primarySvc = getRandom(tenantServices);
        const chosenServices = [primarySvc];

        if (Math.random() > 0.7) {
          const secSvc = getRandom(tenantServices.filter((s) => s.id !== primarySvc.id));
          chosenServices.push(secSvc);
        }

        const items = chosenServices.map((svc) => ({
          serviceId: svc.id,
          serviceNameSnapshot: svc.name,
          unitPrice: svc.price,
          quantity: 1,
          total: svc.price,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const discount = Math.random() > 0.85 ? 10 : 0;
        const total = Math.max(0, subtotal - discount);

        let status = 'DELIVERED';
        if (dayOffset === 0) {
          const statuses = ['DELIVERED', 'READY', 'IN_SERVICE', 'WAITING'];
          status = statuses[w % statuses.length];
        }

        const createdAt = new Date(targetDate.getTime() + (8 + w * 3) * 60 * 60 * 1000);
        const completedAt = status === 'DELIVERED' || status === 'READY'
          ? new Date(createdAt.getTime() + 45 * 60 * 1000)
          : undefined;
        const deliveredAt = status === 'DELIVERED'
          ? new Date(createdAt.getTime() + 60 * 60 * 1000)
          : undefined;

        await prisma.wash.create({
          data: {
            tenantId: tenant.id,
            customerId: vehicle.customerId,
            vehicleId: vehicle.id,
            status,
            subtotal,
            discount,
            total,
            createdAt,
            startedAt: createdAt,
            completedAt,
            deliveredAt,
            items: { create: items },
          },
        });
        tenantWashCount++;
      }
    }

    console.log(`   ✅ Created ${tConfig.name} with ${tenantWashCount} washes.`);
  }

  // Create Demo Pending Tenant (Awaiting Approval)
  const pendingTenant = await prisma.tenant.create({
    data: {
      name: 'Lava Rápido Novo Visual (Aguardando Aprovação)',
      slug: 'lava-rapido-novo-visual',
      email: 'novovisual@lavarapido.com',
      phone: '+5511955550009',
      active: false,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      monthlyFee: 99.0,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: pendingTenant.id,
      name: 'Carlos Novo Visual',
      email: 'novovisual@lavarapido.com',
      password: hashPassword('Seed@2026'),
      role: 'TENANT_ADMIN',
    },
  });

  console.log('\n🎉 Multi-Tenant Seed Complete!');
  console.log('--------------------------------------------------');
  console.log('🔑 Credentials to test:');
  console.log('   - Super Admin:   admin@sistema.com   (pass: Seed@2026)\n   - Express Tenant: express@lavarapido.com (pass: Seed@2026)\n   - Premium Tenant: premium@lavarapido.com (pass: Seed@2026)\n   - Central Tenant: central@lavarapido.com (pass: Seed@2026)');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Multi-Tenant Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
