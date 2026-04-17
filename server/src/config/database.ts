import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Neon's pgbouncer (pooler) runs in transaction mode, which rejects Prisma's
// named prepared statements. Adding ?pgbouncer=true switches Prisma to simple
// query protocol, compatible with pgbouncer transaction mode.
function buildDatabaseUrl(url: string): string {
  const isPooler = url.includes('-pooler.');
  let result = url;
  if (isPooler && !result.includes('pgbouncer=true')) {
    result = result.includes('?') ? `${result}&pgbouncer=true` : `${result}?pgbouncer=true`;
  }
  if (!result.includes('connect_timeout=')) {
    result = `${result}&connect_timeout=30`;
  }
  return result;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl(env.DATABASE_URL) } },
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
