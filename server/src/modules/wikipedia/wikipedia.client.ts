const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API  = 'https://en.wikipedia.org/w/api.php';
const PAGEVIEWS = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';
const WIKIRANK  = 'https://wikirank.net';

const HEADERS = { 'User-Agent': 'WikiBattler/1.0 (https://github.com/wikibattler)' };

export interface WikiSummary {
  pageid: number;
  title: string;
  extract: string;
  length?: number;           // full article byte length from Wikipedia
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

export async function fetchPageviews(title: string): Promise<number> {
  try {
    const slug = encodeURIComponent(title.replace(/ /g, '_'));
    // Always use the previous completed month — current month has no data yet
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const url = `${PAGEVIEWS}/en.wikipedia/all-access/all-agents/${slug}/monthly/${yyyymm}/${yyyymm}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return 0;
    const json = await res.json() as WikiPageviewsResponse;
    return json.items?.[0]?.views ?? 0;
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

/** Derive a 0-100 quality score from article byte length when APIs fail.
 *  Longer articles are generally higher quality on Wikipedia.
 */
export function articleLengthToScore(bytes: number): number {
  if (bytes >= 150_000) return 90;
  if (bytes >= 80_000)  return 80;
  if (bytes >= 40_000)  return 60;
  if (bytes >= 15_000)  return 35;
  if (bytes >= 5_000)   return 20;
  return 8;
}
