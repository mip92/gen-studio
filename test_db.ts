import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();
prisma.$connect()
  .then(() => prisma.project.count())
  .then(n => { console.log('OK — projects:', n); })
  .catch((e: any) => { console.error('FAIL:', e.message); })
  .finally(() => prisma.$disconnect());
