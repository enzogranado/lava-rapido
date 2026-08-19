import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const tenant = await prisma.tenant.findFirst();
    console.log('Tenant found:', tenant?.id, tenant?.name, tenant?.businessType);

    const count = await prisma.parkingTicket.count();
    console.log('ParkingTicket count in DB:', count);

    // Try a test ticket insert and delete
    const testTicket = await prisma.parkingTicket.create({
      data: {
        tenantId: tenant!.id,
        plate: 'TEST123',
        model: 'Carro Teste',
        pickupCode: '1234',
        customerPhone: '11999999999',
        customerName: 'Cliente Teste',
        status: 'PARKED',
      },
    });
    console.log('Created test ticket:', testTicket.id, testTicket.plate);

    await prisma.parkingTicket.delete({ where: { id: testTicket.id } });
    console.log('Deleted test ticket successfully!');
  } catch (err: any) {
    console.error('Error in DB test:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
