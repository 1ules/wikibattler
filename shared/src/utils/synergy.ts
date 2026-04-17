import type { QidNode, DynamicSynergy, TeamSynergyResult } from '../types/synergy.js';

// QIDs too broad or semantically useless for gameplay synergies.
// This is also used by the client to filter display labels on cards.
export const QID_BLOCKLIST = new Set([
  // ── Ontological / too abstract ────────────────────────────────────────────
  'Q35120',    // entity
  'Q488383',   // object
  'Q223557',   // physical object
  'Q16686448', // natural object
  'Q4260475',  // material entity
  'Q1',        // universe
  'Q58778',    // system
  'Q830077',   // subject
  'Q2267440',  // living being / being
  'Q764',      // individual
  'Q3057992',  // mortal
  // ── Human legal/philosophical subtypes (redundant with "human") ──────────
  'Q215627',   // person (abstract, superseded by human Q5)
  'Q2239243',  // natural person
  'Q3778211',  // legal person
  'Q155076',   // juridical person
  'Q613553',   // person or organization
  // ── Overly granular animal taxonomy ──────────────────────────────────────
  'Q795052',   // individual animal
  'Q7239',     // organism (too broad — every living card has it)
  'Q196600',   // living organism
  'Q1053604',  // consumer (ecological role, not a gameplay type)
  'Q16521',    // taxon (meta-concept)
  'Q55983715', // organisms known by a particular common name
  'Q154954',   // eukaryote
  'Q131566',   // tetrapod
  'Q1303',     // bilateria
  'Q5113',     // bilateria (duplicate)
  'Q42848',    // aggregate of organisms
  'Q10260',    // chordate
  // ── Wikimedia meta-pages ──────────────────────────────────────────────────
  'Q18336849', // item with given name property
  'Q4167410',  // Wikimedia disambiguation page
  'Q4167836',  // Wikimedia category
  'Q11266439', // Wikimedia template
  'Q13406463', // Wikimedia list article
  'Q17362920', // Wikimedia duplicated page
]);

const BASE_BONUS = 0.5;          // max per-QID contribution
const MIN_THRESHOLD = 0.04;      // 4% minimum to surface a synergy
const MAX_CP_MULTIPLIER = 4.0;   // absolute cap on total multiplier

function emptyResult(): TeamSynergyResult {
  return {
    synergies: [],
    cpMultiplier: 1,
    statMultipliers: { attack: 1, health: 1, speed: 1 },
  };
}

export interface CardForSynergy {
  qidChain: QidNode[];
}

export function evaluateTeam(cards: CardForSynergy[]): TeamSynergyResult {
  const teamSize = cards.length;
  if (teamSize === 0) return emptyResult();

  // Accumulate QID presence across all cards
  const qidMap = new Map<string, { label: string; minDepth: number; count: number }>();

  for (const card of cards) {
    const seenThisCard = new Set<string>();
    for (const node of card.qidChain) {
      if (QID_BLOCKLIST.has(node.qid) || seenThisCard.has(node.qid)) continue;
      seenThisCard.add(node.qid);
      const existing = qidMap.get(node.qid);
      if (existing) {
        existing.count++;
        if (node.depth < existing.minDepth) existing.minDepth = node.depth;
      } else {
        qidMap.set(node.qid, { label: node.label, minDepth: node.depth, count: 1 });
      }
    }
  }

  const synergies: DynamicSynergy[] = [];

  for (const [qid, { label, minDepth, count }] of qidMap) {
    if (count < 2) continue;
    const specificity = 1 / (minDepth + 1);   // 1.0 depth-0, 0.5 depth-1, 0.33 depth-2 …
    const ratio = count / teamSize;
    const statMultiplier = 1 + specificity * ratio * BASE_BONUS;
    if (statMultiplier - 1 < MIN_THRESHOLD) continue;
    synergies.push({ qid, label, sharedCount: count, teamSize, specificity, statMultiplier });
  }

  synergies.sort((a, b) => b.statMultiplier - a.statMultiplier);

  // Multiplicative stacking, capped
  let combined = synergies.reduce((acc, s) => acc * s.statMultiplier, 1);
  combined = Math.min(combined, MAX_CP_MULTIPLIER);

  return {
    synergies,
    cpMultiplier: combined,
    statMultipliers: { attack: combined, health: combined, speed: combined },
  };
}
