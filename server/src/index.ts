import './config/env.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

async function main() {
  for (let i = 1; i <= 5; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[server] Database connection OK');
      break;
    } catch (err) {
      console.error(`[server] DB warmup attempt ${i}/5 failed:`, (err as Error).message);
      if (i < 5) await new Promise(r => setTimeout(r, 5000));
      else throw err;
    }
  }

  const app = createApp();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[server] Running on http://0.0.0.0:${env.PORT}`);
    console.log(`[server] Environment: ${env.NODE_ENV}`);
  });
}

main().catch(async (err) => {
  console.error('[server] Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
