const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

let prisma;
try {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} catch (e) {
  console.error('PrismaClient init failed:', e.message);
  prisma = null;
}

module.exports = prisma;
