import {
  scoreToRarity,
  RARITY_MULTIPLIERS,
  MAX_STAT_VALUE,
  PACK_SLOT_RATES,
} from '@wikibattler/shared';
import type { Rarity, RarityRates, QidNode } from '@wikibattler/shared';
import {
  fetchRandomSummary,
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
  qidChain: QidNode[];
}

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

  const rawAttack = pageviews > 0
    ? Math.round((Math.log10(pageviews + 1) / Math.log10(2_000_000_000)) * 998) + 1
    : 10;

  const rawHealth = articleBytes > 0
    ? Math.round((Math.log10(articleBytes + 1) / Math.log10(600_000)) * 998) + 1
    : 50;

  const rawSpeed = Math.max(1, Math.round(800 / Math.max(titleLength, 2)));

  return {
    attack: Math.min(Math.round(rawAttack * mult), MAX_STAT_VALUE),
    health: Math.min(Math.round(rawHealth * mult), MAX_STAT_VALUE),
    speed:  Math.min(Math.round(rawSpeed  * mult), MAX_STAT_VALUE),
  };
}

function firstParagraph(text: string): string {
  if (!text) return '';
  const para = text.split('\n')[0] ?? text;
  return para.trim().slice(0, 800);
}

export function rollRarity(rates: RarityRates): Rarity {
  const roll = Math.random() * 100;
  const order: Rarity[] = ['MR', 'UR', 'SSR', 'SR', 'R', 'UC', 'C'];
  let cumulative = 0;
  for (const rarity of order) {
    cumulative += rates[rarity];
    if (roll < cumulative) return rarity;
  }
  return 'C';
}

export async function buildCardFromArticle(
  summary: WikiSummary,
  forcedRarity?: Rarity
): Promise<CardCreateData> {
  // WikiData QIDs are fetched separately (async background enrichment)
  // to keep pack opening fast. qidChain starts empty and is populated later.
  const [pageviews, wikiRankRaw] = await Promise.all([
    fetchPageviews(summary.title),
    forcedRarity ? Promise.resolve(-1) : fetchWikiRankScore(summary.title),
  ]);

  const articleBytes = summary.length ?? summary.extract.length * 8;

  let rarity: Rarity;
  let qualityScore: number;

  if (forcedRarity) {
    rarity = forcedRarity;
    qualityScore = RARITY_REPRESENTATIVE_SCORE[rarity];
  } else {
    qualityScore = wikiRankRaw >= 0
      ? wikiRankRaw
      : articleLengthToScore(articleBytes);
    rarity = scoreToRarity(qualityScore);
  }

  const stats = deriveStats(pageviews, articleBytes, summary.title.length, rarity);

  return {
    wikiPageId:       summary.pageid,
    wikiTitle:        summary.title,
    wikiSlug:         summary.title.replace(/ /g, '_'),
    wikiExtract:      firstParagraph(summary.extract),
    wikiThumbUrl:     summary.thumbnail?.source ?? null,
    wikiQualityScore: qualityScore,
    rarity,
    qidChain: [],
    ...stats,
  };
}

export async function generateSlotCard(slotIndex: number): Promise<CardCreateData> {
  const rates = PACK_SLOT_RATES[slotIndex] ?? PACK_SLOT_RATES[0]!;
  const rarity = rollRarity(rates);
  const summary = await fetchRandomSummary();
  return buildCardFromArticle(summary, rarity);
}

export async function generatePityCard(rarity: Rarity): Promise<CardCreateData> {
  const summary = await fetchRandomSummary();
  return buildCardFromArticle(summary, rarity);
}
