import type { QidNode } from '@wikibattler/shared';

const WIKI_REST   = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API    = 'https://en.wikipedia.org/w/api.php';
const PAGEVIEWS   = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';
const WIKIRANK    = 'https://wikirank.net';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const HEADERS = { 'User-Agent': 'WikiBattler/1.0 (https://github.com/wikibattler)' };

export interface WikiSummary {
  pageid: number;
  title: string;
  extract: string;
  length?: number;
  thumbnail?: { source: string };
  content_urls: { desktop: { page: string } };
  description?: string;
}

export interface WikiCategory {
  ns: number;
  title: string;
}

export interface WikiPageviewsResponse {
  items: Array<{ views: number }>;
}

export async function fetchRandomSummary(): Promise<WikiSummary> {
  const res = await fetch(`${WIKI_REST}/page/random/summary`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Wikipedia random summary failed: ${res.status}`);
  return res.json() as Promise<WikiSummary>;
}

export async function fetchSummaryByTitle(title: string): Promise<WikiSummary> {
  const slug = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/summary/${slug}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Wikipedia summary failed for "${title}": ${res.status}`);
  return res.json() as Promise<WikiSummary>;
}

export async function fetchCategories(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'categories',
    titles: title,
    format: 'json',
    origin: '*',
    cllimit: '50',
  });
  const res = await fetch(`${WIKI_API}?${params}`, { headers: HEADERS });
  if (!res.ok) return [];
  const json = await res.json() as {
    query: { pages: Record<string, { categories?: WikiCategory[] }> };
  };
  const pages = Object.values(json.query.pages);
  const cats = pages[0]?.categories ?? [];
  return cats.map(c => c.title.replace(/^Category:/, '').trim());
}

type WdEntity = {
  id: string;
  missing?: string;
  labels?: { en?: { value: string } };
  claims?: {
    P31?: Array<{ mainsnak: { datavalue?: { value: { id: string } } } }>;
    P279?: Array<{ mainsnak: { datavalue?: { value: { id: string } } } }>;
  };
};

async function wdFetch(params: Record<string, string>): Promise<Record<string, WdEntity>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const qs = new URLSearchParams({ format: 'json', ...params });
    const res = await fetch(`${WIKIDATA_API}?${qs}`, {
      headers: HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const json = await res.json() as { entities?: Record<string, WdEntity> };
    return json.entities ?? {};
  } catch {
    clearTimeout(timer);
    return {};
  }
}

function claimQids(entity: WdEntity, prop: 'P31' | 'P279'): string[] {
  return (entity.claims?.[prop] ?? [])
    .map(c => c.mainsnak.datavalue?.value.id)
    .filter((id): id is string => !!id);
}

/**
 * Fetch WikiData QID ancestry chain via wbgetentities (more reliable than SPARQL).
 * Walks P31 (instance of) → P279 (subclass of) up to 3 hops.
 */
export async function fetchWikiDataQids(title: string): Promise<QidNode[]> {
  try {
    // Step 1: look up the Wikidata entity for this Wikipedia article
    const step1 = await wdFetch({
      action: 'wbgetentities',
      sites: 'enwiki',
      titles: title,
      props: 'claims|labels',
      languages: 'en',
    });

    const rootEntity = Object.values(step1)[0];
    if (!rootEntity || 'missing' in rootEntity) return [];

    const p31Ids = claimQids(rootEntity, 'P31');
    if (p31Ids.length === 0) return [];

    // Step 2: fetch depth-0 types (P31 targets) + their P279 parents
    const step2 = await wdFetch({
      action: 'wbgetentities',
      ids: p31Ids.slice(0, 10).join('|'),
      props: 'claims|labels',
      languages: 'en',
    });

    const nodes: QidNode[] = [];
    const seen = new Set<string>();

    const addNode = (qid: string, label: string, depth: number) => {
      if (seen.has(qid) || !label || label === qid) return;
      seen.add(qid);
      nodes.push({ qid, label, depth });
    };

    const level1Ids: string[] = [];
    for (const [qid, entity] of Object.entries(step2)) {
      const label = entity.labels?.en?.value ?? '';
      addNode(qid, label, 0);
      level1Ids.push(...claimQids(entity, 'P279'));
    }

    if (level1Ids.length === 0) return nodes;

    // Step 3: fetch depth-1 types + their P279 parents
    const unique1 = [...new Set(level1Ids)].filter(id => !seen.has(id)).slice(0, 20);
    const step3 = await wdFetch({
      action: 'wbgetentities',
      ids: unique1.join('|'),
      props: 'claims|labels',
      languages: 'en',
    });

    const level2Ids: string[] = [];
    for (const [qid, entity] of Object.entries(step3)) {
      const label = entity.labels?.en?.value ?? '';
      addNode(qid, label, 1);
      level2Ids.push(...claimQids(entity, 'P279'));
    }

    if (level2Ids.length === 0) return nodes;

    // Step 4: fetch depth-2 types (labels only, no further walking)
    const unique2 = [...new Set(level2Ids)].filter(id => !seen.has(id)).slice(0, 20);
    const step4 = await wdFetch({
      action: 'wbgetentities',
      ids: unique2.join('|'),
      props: 'labels',
      languages: 'en',
    });

    for (const [qid, entity] of Object.entries(step4)) {
      const label = entity.labels?.en?.value ?? '';
      addNode(qid, label, 2);
    }

    return nodes;
  } catch {
    return [];
  }
}

/**
 * Fetch all-time pageviews for a Wikipedia article by summing monthly data
 * from July 2015 (earliest available) through last completed month.
 */
export async function fetchPageviews(title: string): Promise<number> {
  try {
    const slug = encodeURIComponent(title.replace(/ /g, '_'));
    const start = '2015070100';
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const end = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}0100`;
    const url = `${PAGEVIEWS}/en.wikipedia/all-access/user/${slug}/monthly/${start}/${end}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return 0;
    const json = await res.json() as WikiPageviewsResponse;
    return (json.items ?? []).reduce((sum, item) => sum + item.views, 0);
  } catch {
    return 0;
  }
}

export async function fetchWikiRankScore(title: string): Promise<number> {
  try {
    const slug = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(`${WIKIRANK}/en/${slug}`, {
      headers: { ...HEADERS, Accept: 'application/json' },
    });
    if (!res.ok) return -1;
    const text = await res.text();
    const match = text.match(/"quality_score"\s*:\s*(\d+(?:\.\d+)?)/);
    if (match?.[1]) return Math.round(parseFloat(match[1]));
    return -1;
  } catch {
    return -1;
  }
}

export function articleLengthToScore(bytes: number): number {
  if (bytes >= 150_000) return 90;
  if (bytes >= 80_000)  return 80;
  if (bytes >= 40_000)  return 60;
  if (bytes >= 15_000)  return 35;
  if (bytes >= 5_000)   return 20;
  return 8;
}
