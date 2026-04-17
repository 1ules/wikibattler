import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Neon pooler (pgbouncer, transaction mode) rejects named prepared statements.
// ?pgbouncer=true switches Prisma to simple query protocol.
// ?sslmode=require is mandatory — Neon drops non-SSL connections at the TLS layer,
// which Prisma reports as P1001 "can't reach database server".
function buildDatabaseUrl(url: string): string {
  const params: string[] = [];
  if (url.includes('-pooler.') && !url.includes('pgbouncer=true')) {
    params.push('pgbouncer=true');
  }
  if (!url.includes('sslmode=')) {
    params.push('sslmode=require');
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
