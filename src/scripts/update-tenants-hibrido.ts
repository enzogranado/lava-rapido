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

async function checkTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    console.log(`Found ${tenants.length} tenants in the database:\n`);
    for (const t of tenants) {
      console.log(`- ID: ${t.id} | Name: "${t.name}" | Slug: "${t.slug}" | businessType: "${t.businessType}" | Users: ${t.users.map(u => u.email).join(', ')}`);
    }

    // Ensure all existing tenants have businessType = 'HIBRIDO'
    const updated = await prisma.tenant.updateMany({
      data: {
        businessType: 'HIBRIDO',
      },
    });

    console.log(`\nUpdated ${updated.count} tenants to businessType = "HIBRIDO" so all existing accounts (like Paraíso Car) have full access to both Lava Rápido and Estacionamento!`);
  } catch (err) {
    console.error('Error updating tenants:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkTenants();
