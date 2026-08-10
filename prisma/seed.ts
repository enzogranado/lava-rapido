import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
  url: 'file:' + path.join(process.cwd(), 'dev.db'),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database with realistic continuous history...');

  // 1. Settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'Meu Lava Rápido',
      inactiveDaysLimit: 45,
    },
  });

  // 2. Services
  const servicesData = [
    { name: 'Lavagem Simples', description: 'Lavagem externa com água e shampoo automotivo.', price: 40.0 },
    { name: 'Lavagem Completa', description: 'Lavagem externa + limpeza interna + acabamento.', price: 80.0 },
    { name: 'Lavagem Premium', description: 'Lavagem completa + cera + perfumaria + detalhamento.', price: 120.0 },
    { name: 'Higienização Interna', description: 'Limpeza profunda do interior do veículo.', price: 120.0 },
    { name: 'Higienização de Bancos', description: 'Limpeza profunda dos bancos com extratora.', price: 150.0 },
    { name: 'Enceramento', description: 'Aplicação de cera protetora para brilho da pintura.', price: 30.0 },
    { name: 'Polimento', description: 'Polimento técnico para remoção de riscos.', price: 200.0 },
    { name: 'Lavagem de Motor', description: 'Limpeza e desengorduramento do motor.', price: 60.0 },
    { name: 'Limpeza de Ar-condicionado', description: 'Higienização do sistema de ar-condicionado.', price: 80.0 },
    { name: 'Cristalização', description: 'Cristalização da pintura para proteção duradoura.', price: 250.0 },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { id: s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') },
      update: { price: s.price, description: s.description },
      create: {
        id: s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        ...s,
      },
    });
  }

  const allServices = await prisma.service.findMany();

  // 3. Customers
  const customerList = [
    { name: 'João Silva', phone: '+5511999990001', notes: 'Cliente VIP' },
    { name: 'Maria Oliveira', phone: '+5511999990002', notes: 'Gosta de lavagem completa' },
    { name: 'Pedro Santos', phone: '+5511999990003', notes: 'Prefere higienização' },
    { name: 'Ana Costa', phone: '+5511999990004', notes: '' },
    { name: 'Carlos Ferreira', phone: '+5511999990005', notes: 'Cliente frequente' },
    { name: 'Fernanda Lima', phone: '+5511999990006', notes: '' },
    { name: 'Lucas Mendes', phone: '+5511999990007', notes: 'Cliente corporativo' },
    { name: 'Beatriz Rocha', phone: '+5511999990008', notes: '' },
    { name: 'Gabriel Almeida', phone: '+5511999990009', notes: 'Vem quase todo fim de semana' },
    { name: 'Camila Souza', phone: '+5511999990010', notes: '' },
    { name: 'Rodrigo Barbosa', phone: '+5511999990011', notes: '' },
    { name: 'Juliana Martins', phone: '+5511999990012', notes: '' },
    { name: 'Marcelo Dias', phone: '+5511999990013', notes: 'Cliente inativo' },
    { name: 'Patricia Ribeiro', phone: '+5511999990014', notes: 'Cliente inativo' },
  ];

  const dbCustomers = [];
  for (const c of customerList) {
    const cust = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name, notes: c.notes },
      create: c,
    });
    dbCustomers.push(cust);
  }

  // 4. Vehicles
  const vehicleList = [
    { customerIndex: 0, model: 'Honda HR-V', plate: 'ABC1D23', color: 'Branco' },
    { customerIndex: 0, model: 'Toyota Corolla', plate: 'XYZ4E56', color: 'Prata' },
    { customerIndex: 1, model: 'Hyundai HB20', plate: 'DEF7G89', color: 'Preto' },
    { customerIndex: 2, model: 'Volkswagen T-Cross', plate: 'GHI0J12', color: 'Vermelho' },
    { customerIndex: 2, model: 'Fiat Pulse', plate: 'KLM3N45', color: 'Azul' },
    { customerIndex: 3, model: 'Chevrolet Onix', plate: 'OPQ6R78', color: 'Cinza' },
    { customerIndex: 4, model: 'Jeep Renegade', plate: 'STU9V01', color: 'Verde' },
    { customerIndex: 5, model: 'Honda Civic', plate: 'VWX2Y34', color: 'Preto' },
    { customerIndex: 6, model: 'Toyota Hilux', plate: 'ZAB5C67', color: 'Branco' },
    { customerIndex: 7, model: 'Jeep Compass', plate: 'DEF8G90', color: 'Prata' },
    { customerIndex: 8, model: 'Volkswagen Polo', plate: 'HIJ1K23', color: 'Cinza' },
    { customerIndex: 9, model: 'Chevrolet Tracker', plate: 'LMN4O56', color: 'Azul' },
    { customerIndex: 10, model: 'Nissan Kicks', plate: 'PQR7S89', color: 'Laranja' },
    { customerIndex: 11, model: 'Fiat Argo', plate: 'TUV0W12', color: 'Branco' },
    { customerIndex: 12, model: 'Renault Duster', plate: 'XYZ3A45', color: 'Marrom' },
    { customerIndex: 13, model: 'Peugeot 208', plate: 'BCD6E78', color: 'Azul' },
  ];

  const dbVehicles = [];
  for (const v of vehicleList) {
    const cust = dbCustomers[v.customerIndex];
    const veh = await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: { model: v.model, color: v.color },
      create: {
        customerId: cust.id,
        model: v.model,
        plate: v.plate,
        color: v.color,
      },
    });
    dbVehicles.push(veh);
  }

  // Clear existing washes & washItems to re-seed cleanly
  await prisma.washItem.deleteMany();
  await prisma.wash.deleteMany();

  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const now = new Date();

  console.log('⏳ Generating 120 days of washes history...');

  for (let dayOffset = 120; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dayOfWeek = targetDate.getDay();

    let dailyWashCount = dayOfWeek === 0 || dayOfWeek === 6 ? getRandomInt(4, 8) : getRandomInt(2, 5);

    if (dayOffset === 0) {
      dailyWashCount = 4;
    }

    for (let i = 0; i < dailyWashCount; i++) {
      const maxVehIndex = dayOffset < 50 ? 11 : dbVehicles.length - 1;
      const vehicle = dbVehicles[getRandomInt(0, maxVehIndex)];
      const customerId = vehicle.customerId;

      let status = 'DELIVERED';
      if (dayOffset === 0) {
        const statuses = ['DELIVERED', 'DELIVERED', 'READY', 'IN_SERVICE', 'WAITING'];
        status = statuses[i % statuses.length];
      } else {
        const randVal = Math.random();
        if (randVal < 0.92) status = 'DELIVERED';
        else if (randVal < 0.97) status = 'DELIVERED';
        else status = 'CANCELLED';
      }

      const primarySvc = getRandom(allServices);
      const chosenServices = [primarySvc];
      if (Math.random() > 0.6) {
        const secSvc = getRandom(allServices.filter((s) => s.id !== primarySvc.id));
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
      const discount = Math.random() > 0.8 ? 10 : 0;
      const total = Math.max(0, subtotal - discount);

      const hour = 8 + Math.floor((i * 9) / dailyWashCount) + getRandomInt(0, 1);
      const minute = getRandomInt(0, 59);
      const createdAt = new Date(targetDate);
      createdAt.setHours(hour, minute, 0, 0);

      const startedAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
      const completedAt = status === 'DELIVERED' || status === 'READY'
        ? new Date(createdAt.getTime() + (45 + getRandomInt(10, 40)) * 60 * 1000)
        : undefined;
      const deliveredAt = status === 'DELIVERED'
        ? new Date(createdAt.getTime() + (60 + getRandomInt(15, 60)) * 60 * 1000)
        : undefined;

      await prisma.wash.create({
        data: {
          customerId,
          vehicleId: vehicle.id,
          status,
          subtotal,
          discount,
          total,
          createdAt,
          startedAt,
          completedAt,
          deliveredAt,
          items: {
            create: items,
          },
        },
      });
    }
  }

  const washTotalCount = await prisma.wash.count();
  console.log('✅ Seed completed successfully!');
  console.log(`📊 Total washes created: ${washTotalCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
