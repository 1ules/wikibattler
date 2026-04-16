import type { QidNode } from '@wikibattler/shared';

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API  = 'https://en.wikipedia.org/w/api.php';
const PAGEVIEWS = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';
const WIKIRANK  = 'https://wikirank.net';
const SPARQL    = 'https://query.wikidata.org/sparql';

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

/**
 * Fetch WikiData QID ancestry chain for a Wikipedia article via SPARQL.
 * Walks P31 (instance of) → P279 (subclass of) up to 3 hops, returns
 * each type node with its QID, English label, and depth in the chain.
 */
export async function fetchWikiDataQids(title: string): Promise<QidNode[]> {
  // Escape title for SPARQL string literal
  const escaped = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const query = `
SELECT DISTINCT ?depth ?type ?typeLabel WHERE {
  {
    SELECT ?item WHERE {
      ?article schema:about ?item ;
               schema:isPartOf <https://en.wikipedia.org/> ;
               schema:name "${escaped}"@en .
    }
  }
  {
    { ?item wdt:P31 ?type . BIND(0 AS ?depth) }
    UNION
    { ?item wdt:P31/wdt:P279 ?type . BIND(1 AS ?depth) }
    UNION
    { ?item wdt:P31/wdt:P279/wdt:P279 ?type . BIND(2 AS ?depth) }
    UNION
    { ?item wdt:P31/wdt:P279/wdt:P279/wdt:P279 ?type . BIND(3 AS ?depth) }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 60`.trim();

  try {
    const url = `${SPARQL}?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { ...HEADERS, Accept: 'application/sparql-results+json' },
    });
    if (!res.ok) return [];

    const json = await res.json() as {
      results: {
        bindings: Array<{
          depth:     { value: string };
          type:      { value: string };
          typeLabel: { value: string };
        }>;
      };
    };

    const nodes: QidNode[] = [];
    for (const b of json.results.bindings) {
      const qid = b.type.value.replace('http://www.wikidata.org/entity/', '');
      const label = b.typeLabel.value;
      const depth = parseInt(b.depth.value, 10);
      // Skip if label is just the QID (no English label found)
      if (!label || label === qid) continue;
      nodes.push({ qid, label, depth });
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
