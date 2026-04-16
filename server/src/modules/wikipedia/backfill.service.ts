import { prisma } from '../../config/database.js';
import { fetchWikiDataQids } from '../wikipedia/wikipedia.client.js';

/**
 * Enrich a specific list of cards with WikiData QID chains.
 * Used after pack opening to populate qidChain non-blocking.
 */
export async function enrichCardsWithQids(
  cards: { id: string; wikiTitle: string }[]
): Promise<void> {
  for (const card of cards) {
    try {
      const qidChain = await fetchWikiDataQids(card.wikiTitle);
      if (qidChain.length === 0) continue;
      await prisma.card.update({
        where: { id: card.id },
        data:  { qidChain: qidChain as unknown as object[] },
      });
      // Small delay to respect WikiData SPARQL rate limits
      await new Promise(r => setTimeout(r, 800));
    } catch {
      // Non-critical — card still works without QIDs
    }
  }
}

/**
 * Backfill qidChain for ALL cards with empty arrays (admin use).
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
      if (qidChain.length === 0) { skipped++; continue; }
      await prisma.card.update({
        where: { id: card.id },
        data:  { qidChain: qidChain as unknown as object[] },
      });
      updated++;
      await new Promise(r => setTimeout(r, 1100));
    } catch {
      errors++;
    }
  }

  return { updated, skipped, errors };
}
