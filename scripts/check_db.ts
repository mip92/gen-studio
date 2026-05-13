/**
 * Verify PostgreSQL connectivity and list databases.
 * Run: npx tsx scripts/check_db.ts
 */
import { execSync } from 'child_process';

// Try connecting via prisma with current env
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@'));

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();
prisma.$connect()
  .then(() => prisma.$queryRaw<{ datname: string }[]>`SELECT datname FROM pg_database WHERE datistemplate = false`)
  .then(rows => {
    console.log('Databases:', rows.map(r => r.datname).join(', '));
    return prisma.project.count();
  })
  .then(n => console.log('Projects in DB:', n))
  .catch((e: any) => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
