#!/bin/sh
# Retry prisma migrate deploy to handle Neon free-tier cold-start (P1001/P1002).
# Neon suspends compute after inactivity; the first connection attempt often fails
# for a few seconds while the compute wakes up.

MAX=8
WAIT=8
i=1

while [ $i -le $MAX ]; do
  echo "[start] Migration attempt $i/$MAX..."
  node_modules/.bin/prisma migrate deploy --schema src/prisma/schema.prisma && break
  if [ $i -eq $MAX ]; then
    echo "[start] Could not apply migrations after $MAX attempts — starting server anyway."
  else
    echo "[start] DB not ready, retrying in ${WAIT}s..."
    sleep $WAIT
  fi
  i=$((i + 1))
done

exec node dist/index.js
