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

async function checkWithAuth() {
  try {
    const user = await prisma.user.findFirst({
      include: { tenant: true },
    });
    console.log('User found:', user?.email, user?.role, user?.tenant?.id);

    const payload = {
      userId: user!.id,
      tenantId: user!.tenantId,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      tenantName: user!.tenant?.name,
      businessType: user!.tenant?.businessType,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    const sessionToken = Buffer.from(JSON.stringify(payload)).toString('base64');

    const res = await fetch('http://localhost:3000/api/parking?status=PARKED&search=', {
      headers: {
        Cookie: `lava_session=${sessionToken}`,
      },
    });

    console.log('HTTP Status with Auth:', res.status);
    const body = await res.text();
    console.log('Response body:', body);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkWithAuth();
