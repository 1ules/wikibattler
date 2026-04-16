import { prisma } from '../../config/database.js';
import { fetchWikiDataQids } from '../wikipedia/wikipedia.client.js';
import type { QidNode } from '@wikibattler/shared';

/**
 * Backfill qidChain for all cards that currently have an empty array.
 * Processes in small batches to respect WikiData SPARQL rate limits (~60 req/min).
 */
export async function backfillQidChains(): Promise<{ updated: number; skipped: number; errors: number }> {
  const cards = await prisma.card.findMany({
    where: { qidChain: { equals: [] } },
    select: { id: true, wikiTitle: true },
  });

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const card of cards) {
    try {
      const qidChain = await fetchWikiDataQids(card.wikiTitle);
      if (qidChain.length === 0) {
        skipped++;
        continue;
      }
      await prisma.card.update({
        where: { id: card.id },
        data:  { qidChain: qidChain as unknown as object[] },
      });
      updated++;
      // ~1 req/sec to stay well under the 60 req/min SPARQL limit
      await new Promise(r => setTimeout(r, 1100));
    } catch {
      errors++;
    }
  }

  return { updated, skipped, errors };
}
