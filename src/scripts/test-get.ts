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

async function testGet() {
  try {
    const tenant = await prisma.tenant.findFirst();
    const tenantId = tenant!.id;
    console.log('Testing GET with tenantId:', tenantId);

    const tickets = await prisma.parkingTicket.findMany({
      where: { tenantId, status: 'PARKED' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, model: true, plate: true, color: true } },
        wash: { select: { id: true, status: true, total: true } },
      },
      orderBy: { entryTime: 'desc' },
    });

    console.log('Tickets found:', tickets.length);
  } catch (err: any) {
    console.error('Error in testGet:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testGet();
