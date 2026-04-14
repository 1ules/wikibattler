import {
  scoreToRarity,
  RARITY_MULTIPLIERS,
  MAX_STAT_VALUE,
  categoriesToTags,
} from '@wikibattler/shared';
import type { Rarity } from '@wikibattler/shared';
import {
  fetchRandomSummary,
  fetchCategories,
  fetchPageviews,
  fetchWikiRankScore,
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

function deriveStats(
  pageviews: number,
  contentLength: number,
  titleLength: number,
  rarity: Rarity
): { attack: number; health: number; speed: number } {
  const mult = RARITY_MULTIPLIERS[rarity];

  const rawAttack = pageviews > 0
    ? Math.round((Math.log10(pageviews + 1) / Math.log10(2_000_001)) * 999) + 1
    : 1;

  const rawHealth = Math.round((Math.min(contentLength, 200_000) / 200_000) * 999) + 1;
  const rawSpeed  = Math.min(titleLength, 100);

  return {
    attack: Math.min(Math.round(rawAttack  * mult), MAX_STAT_VALUE),
    health: Math.min(Math.round(rawHealth  * mult), MAX_STAT_VALUE),
    speed:  Math.min(Math.round(rawSpeed   * mult), MAX_STAT_VALUE),
  };
}

export async function buildCardFromArticle(summary: WikiSummary): Promise<CardCreateData> {
  const [categories, pageviews, qualityScore] = await Promise.all([
    fetchCategories(summary.title),
    fetchPageviews(summary.title),
    fetchWikiRankScore(summary.title),
  ]);

  const rarity = scoreToRarity(qualityScore);
  const contentLength = summary.extract.length;
  const titleLength   = summary.title.length;
  const stats = deriveStats(pageviews, contentLength, titleLength, rarity);
  const tags  = categoriesToTags(categories);

  return {
    wikiPageId:       summary.pageid,
    wikiTitle:        summary.title,
    wikiSlug:         summary.title.replace(/ /g, '_'),
    wikiExtract:      summary.extract.slice(0, 500),
    wikiThumbUrl:     summary.thumbnail?.source ?? null,
    wikiQualityScore: qualityScore,
    rarity,
    categories,
    tags,
    ...stats,
  };
}

export async function generateRandomCard(): Promise<CardCreateData> {
  const summary = await fetchRandomSummary();
  return buildCardFromArticle(summary);
}
