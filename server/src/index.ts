import './config/env.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

async function main() {
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
