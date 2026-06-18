import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prismaV2: PrismaClient | undefined;
}

let dbInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  dbInstance = new PrismaClient({ adapter });
} else {
  if (!globalThis.prismaV2) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaPg(pool);
    globalThis.prismaV2 = new PrismaClient({ adapter });
  }
  dbInstance = globalThis.prismaV2;
}

export const db = dbInstance;

