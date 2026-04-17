import { Prisma, PrismaClient } from '@prisma/client';
import { env } from './env.js';

function buildDatabaseUrl(url: string): string {
  const params: string[] = [];
  // Neon pooler (pgbouncer transaction mode) rejects named prepared statements.
  if (url.includes('-pooler.') && !url.includes('pgbouncer=true')) {
    params.push('pgbouncer=true');
  }
  // Neon requires SSL; enforce it regardless of what the env URL specifies.
  if (!url.includes('sslmode=')) {
    params.push('sslmode=require');
  }
  if (!url.includes('connect_timeout=')) {
    params.push('connect_timeout=30');
  }
  if (params.length === 0) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${params.join('&')}`;
}

function isConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === 'P1001' || err.code === 'P1002';
  }
  return false;
}

function createPrismaClient() {
  const base = new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl(env.DATABASE_URL) } },
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Retry on P1001 (can't reach DB) — handles Neon cold starts where the compute
  // takes a few seconds to wake up after being suspended.
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ query, args }) {
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              return await query(args);
            } catch (err) {
              if (isConnectionError(err) && attempt < 3) {
                console.warn(`[db] Connection error (attempt ${attempt}/3), retrying in ${attempt * 2}s…`);
                await new Promise(r => setTimeout(r, attempt * 2000));
                continue;
              }
              throw err;
            }
          }
          throw new Error('[db] unreachable');
        },
      },
    },
  });
}

type ExtendedPrisma = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrisma };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
