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

function deriveStats(
  pageviews: number,
  articleBytes: number,
  titleLength: number,
  rarity: Rarity
): { attack: number; health: number; speed: number } {
  const mult = RARITY_MULTIPLIERS[rarity];

  // ATK — log scale on monthly pageviews (10 views→~50, 1k→~350, 100k→~700, 1M→~950)
  const rawAttack = pageviews > 0
    ? Math.round((Math.log10(pageviews + 1) / Math.log10(2_000_000)) * 998) + 1
    : 10; // articles with no view data still get a small base

  // HP — log scale on full article byte length (5k bytes→~150, 50k→~500, 500k→~999)
  const rawHealth = articleBytes > 0
    ? Math.round((Math.log10(articleBytes + 1) / Math.log10(600_000)) * 998) + 1
    : 50;

  // SPD — inverse of title length; short punchy titles = fast (len 5→100, len 50→~10)
  const rawSpeed = Math.max(1, Math.round(800 / Math.max(titleLength, 2)));

  return {
    attack: Math.min(Math.round(rawAttack * mult), MAX_STAT_VALUE),
    health: Math.min(Math.round(rawHealth * mult), MAX_STAT_VALUE),
    speed:  Math.min(Math.round(rawSpeed  * mult), MAX_STAT_VALUE),
  };
}

/** Extract first sentence from Wikipedia extract, hard-cap at maxWords. */
function firstSentence(text: string, maxWords = 10): string {
  if (!text) return '';
  const dot = text.search(/[.!?]/);
  const sentence = dot > 0 ? text.slice(0, dot) : text;
  const words = sentence.trim().split(/\s+/);
  if (words.length <= maxWords) return sentence.trim();
  return words.slice(0, maxWords).join(' ') + '\u2026'; // …
}

export async function buildCardFromArticle(summary: WikiSummary): Promise<CardCreateData> {
  const [categories, pageviews, wikiRankRaw] = await Promise.all([
    fetchCategories(summary.title),
    fetchPageviews(summary.title),
    fetchWikiRankScore(summary.title),
  ]);

  // Use WikiRank if available; otherwise derive from article byte length
  const articleBytes = summary.length ?? summary.extract.length * 8;
  const qualityScore = wikiRankRaw >= 0
    ? wikiRankRaw
    : articleLengthToScore(articleBytes);

  const rarity = scoreToRarity(qualityScore);
  const titleLength = summary.title.length;
  const stats = deriveStats(pageviews, articleBytes, titleLength, rarity);
  const tags  = categoriesToTags(categories);

  return {
    wikiPageId:       summary.pageid,
    wikiTitle:        summary.title,
    wikiSlug:         summary.title.replace(/ /g, '_'),
    wikiExtract:      firstSentence(summary.extract, 10),
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
