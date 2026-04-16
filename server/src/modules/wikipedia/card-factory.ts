import {
  scoreToRarity,
  RARITY_MULTIPLIERS,
  RARITY_SCORE_THRESHOLDS,
  MAX_STAT_VALUE,
  PACK_SLOT_RATES,
  categoriesToTags,
} from '@wikibattler/shared';
import type { Rarity, RarityRates } from '@wikibattler/shared';
import {
  fetchRandomSummary,
  fetchCategories,
  fetchPageviews,
  fetchWikiRankScore,
  articleLengthToScore,
  type WikiSummary,
} from './wikipedia.client.js';

export interface CardCreateData {
  wikiPageId: number;
  wikiTitle: string;
  wikiSlug: string;
  wikiExtract: string;
  wikiThumbUrl: string | null;
  wikiQualityScore: number;
  attack: number;
  health: number;
  speed: number;
  rarity: Rarity;
  categories: string[];
  tags: string[];
}

// Representative quality score to store per forced rarity (midpoint of each band)
const RARITY_REPRESENTATIVE_SCORE: Record<Rarity, number> = {
  C:   10,
  UC:  27,
  R:   47,
  SR:  70,
  SSR: 85,
  UR:  95,
  MR: 100,
};

function deriveStats(
  pageviews: number,
  articleBytes: number,
  titleLength: number,
  rarity: Rarity
): { attack: number; health: number; speed: number } {
  const mult = RARITY_MULTIPLIERS[rarity];

  // ATK — log scale on all-time pageviews
  // Scale: 10k views→~230, 1M→~500, 100M→~770, 1B→~900
  const rawAttack = pageviews > 0
    ? Math.round((Math.log10(pageviews + 1) / Math.log10(2_000_000_000)) * 998) + 1
    : 10;

  // HP — log scale on full article byte length (5k bytes→~150, 50k→~500, 500k→~999)
  const rawHealth = articleBytes > 0
    ? Math.round((Math.log10(articleBytes + 1) / Math.log10(600_000)) * 998) + 1
    : 50;

  // SPD — inverse of title length; short punchy titles = fast
  const rawSpeed = Math.max(1, Math.round(800 / Math.max(titleLength, 2)));

  return {
    attack: Math.min(Math.round(rawAttack * mult), MAX_STAT_VALUE),
    health: Math.min(Math.round(rawHealth * mult), MAX_STAT_VALUE),
    speed:  Math.min(Math.round(rawSpeed  * mult), MAX_STAT_VALUE),
  };
}

/**
 * Extract the first paragraph from a Wikipedia extract.
 * Wikipedia extracts separate paragraphs with \n. We take the first one,
 * capped at 800 chars so the DB field stays reasonable.
 */
function firstParagraph(text: string): string {
  if (!text) return '';
  const para = text.split('\n')[0] ?? text;
  return para.trim().slice(0, 800);
}

/**
 * Roll a rarity from a weighted rate table using a single random number.
 * The rates object values are percentages that must sum to 100.
 */
export function rollRarity(rates: RarityRates): Rarity {
  const roll = Math.random() * 100;
  const order: Rarity[] = ['MR', 'UR', 'SSR', 'SR', 'R', 'UC', 'C'];
  let cumulative = 0;
  for (const rarity of order) {
    cumulative += rates[rarity];
    if (roll < cumulative) return rarity;
  }
  return 'C'; // fallback
}

export async function buildCardFromArticle(
  summary: WikiSummary,
  forcedRarity?: Rarity
): Promise<CardCreateData> {
  const [categories, pageviews, wikiRankRaw] = await Promise.all([
    fetchCategories(summary.title),
    fetchPageviews(summary.title),
    forcedRarity ? Promise.resolve(-1) : fetchWikiRankScore(summary.title),
  ]);

  const articleBytes = summary.length ?? summary.extract.length * 8;

  let rarity: Rarity;
  let qualityScore: number;

  if (forcedRarity) {
    // Rarity was pre-determined by the pack's slot roll — override quality score
    rarity = forcedRarity;
    qualityScore = RARITY_REPRESENTATIVE_SCORE[rarity];
  } else {
    qualityScore = wikiRankRaw >= 0
      ? wikiRankRaw
      : articleLengthToScore(articleBytes);
    rarity = scoreToRarity(qualityScore);
  }

  const titleLength = summary.title.length;
  const stats = deriveStats(pageviews, articleBytes, titleLength, rarity);
  const rawTags = categoriesToTags(categories);
  const tags    = rawTags.length > 0 ? rawTags : ['null'];

  return {
    wikiPageId:       summary.pageid,
    wikiTitle:        summary.title,
    wikiSlug:         summary.title.replace(/ /g, '_'),
    wikiExtract:      firstParagraph(summary.extract),
    wikiThumbUrl:     summary.thumbnail?.source ?? null,
    wikiQualityScore: qualityScore,
    rarity,
    categories,
    tags,
    ...stats,
  };
}

/** Generate a card for a specific pack slot (uses slot-specific rarity rates). */
export async function generateSlotCard(slotIndex: number): Promise<CardCreateData> {
  const rates = PACK_SLOT_RATES[slotIndex] ?? PACK_SLOT_RATES[0]!;
  const rarity = rollRarity(rates);
  const summary = await fetchRandomSummary();
  return buildCardFromArticle(summary, rarity);
}

/** Generate a single card with a forced rarity (for pity packs). */
export async function generatePityCard(rarity: Rarity): Promise<CardCreateData> {
  const summary = await fetchRandomSummary();
  return buildCardFromArticle(summary, rarity);
}
