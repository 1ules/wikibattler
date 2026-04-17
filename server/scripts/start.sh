#!/bin/sh
# Run migrations once. If they fail (P1001 Neon cold start, P1002 pooler lock),
# skip and start the server anyway — schema is already up to date from prior deploys.
echo "[start] Applying migrations..."
node_modules/.bin/prisma migrate deploy --schema src/prisma/schema.prisma \
  && echo "[start] Migrations OK." \
  || echo "[start] Migrations failed — starting server anyway."

exec node dist/index.js
