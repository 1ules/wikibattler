import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Neon's pgbouncer (pooler) runs in transaction mode, which rejects Prisma's
// named prepared statements. Adding ?pgbouncer=true switches Prisma to simple
// query protocol, compatible with pgbouncer transaction mode.
function buildDatabaseUrl(url: string): string {
  const params: string[] = [];
  if (url.includes('-pooler.') && !url.includes('pgbouncer=true')) {
    params.push('pgbouncer=true');
  }
  if (!url.includes('connect_timeout=')) {
    params.push('connect_timeout=30');
  }
  if (params.length === 0) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${params.join('&')}`;
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
