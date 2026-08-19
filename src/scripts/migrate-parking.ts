import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL via pg pool successfully!');

    await client.query(`
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "businessType" TEXT NOT NULL DEFAULT 'HIBRIDO';
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "parkingHourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0;
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "parkingAdditionalHourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0;
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "parkingDailyRate" DOUBLE PRECISION NOT NULL DEFAULT 50.0;
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "parkingGraceMinutes" INTEGER NOT NULL DEFAULT 15;
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "parkingSpots" INTEGER NOT NULL DEFAULT 30;
      ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "whatsappParkingTemplate" TEXT NOT NULL DEFAULT 'Olá, {nome}! 🅿️🚗\n\nSeu veículo {modelo} (placa {placa}) deu entrada no nosso estacionamento às {entrada}.\n\n🔑 Seu Código de Retirada: *{codigo}*\n\nAcompanhe o tempo e valor em tempo real:\n{link}';

      CREATE TABLE IF NOT EXISTS "ParkingTicket" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tenantId" TEXT NOT NULL DEFAULT 'tenant-default',
        "customerId" TEXT,
        "vehicleId" TEXT,
        "plate" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "color" TEXT,
        "customerName" TEXT,
        "customerPhone" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PARKED',
        "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "exitTime" TIMESTAMP(3),
        "pickupCode" TEXT NOT NULL,
        "pickupCodeBypassed" BOOLEAN NOT NULL DEFAULT false,
        "trackingToken" TEXT UNIQUE,
        "hourlyRateSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
        "additionalHourlyRateSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        "totalStayMinutes" INTEGER,
        "stayFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "washFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "paymentMethod" TEXT,
        "notes" TEXT,
        "spotNumber" TEXT,
        "washId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ParkingTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ParkingTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "ParkingTicket_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "ParkingTicket_washId_fkey" FOREIGN KEY ("washId") REFERENCES "Wash"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "ParkingTicket_tenantId_status_idx" ON "ParkingTicket"("tenantId", "status");
      CREATE INDEX IF NOT EXISTS "ParkingTicket_tenantId_plate_idx" ON "ParkingTicket"("tenantId", "plate");
      CREATE INDEX IF NOT EXISTS "ParkingTicket_entryTime_idx" ON "ParkingTicket"("entryTime");
    `);

    console.log('✅ Database schema migrated successfully for Parking & Hybrid system!');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
