import './config/env.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

async function warmupDb() {
  for (let i = 1; i <= 10; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[server] Database connection OK');
      return;
    } catch (err) {
      console.warn(`[server] DB warmup ${i}/10:`, (err as Error).message.split('\n')[0]);
      await new Promise(r => setTimeout(r, 6000));
    }
  }
  console.warn('[server] DB warmup gave up — Neon will wake on first request');
}

async function main() {
  const app = createApp();

  // Bind port first so Render detects it immediately, then warm up DB in background.
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[server] Running on http://0.0.0.0:${env.PORT}`);
    console.log(`[server] Environment: ${env.NODE_ENV}`);
    void warmupDb();
  });
}

main().catch(async (err) => {
  console.error('[server] Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
