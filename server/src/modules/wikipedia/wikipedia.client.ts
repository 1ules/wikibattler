const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API  = 'https://en.wikipedia.org/w/api.php';
const PAGEVIEWS = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';
const WIKIRANK  = 'https://wikirank.net';

const HEADERS = { 'User-Agent': 'WikiBattler/1.0 (https://github.com/wikibattler)' };

export interface WikiSummary {
  pageid: number;
  title: string;
  extract: string;
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
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
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
    // WikiRank API: try their JSON endpoint for quality score
    const slug = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(`${WIKIRANK}/en/${slug}`, {
      headers: { ...HEADERS, Accept: 'application/json' },
    });
    if (!res.ok) return await fetchOresScore(title);

    // WikiRank returns HTML by default; parse the quality score from JSON if available
    const text = await res.text();
    const match = text.match(/"quality_score"\s*:\s*(\d+(?:\.\d+)?)/);
    if (match?.[1]) return Math.round(parseFloat(match[1]));

    return await fetchOresScore(title);
  } catch {
    return await fetchOresScore(title);
  }
}

async function fetchOresScore(title: string): Promise<number> {
  try {
    const slug = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(
      `https://ores.wikimedia.org/v3/scores/enwiki?models=articlequality&titles=${slug}`,
      { headers: HEADERS }
    );
    if (!res.ok) return 0;

    const json = await res.json() as {
      enwiki: { scores: Record<string, { articlequality?: { score?: { prediction?: string } } }> };
    };
    const scores = Object.values(json.enwiki?.scores ?? {});
    const prediction = scores[0]?.articlequality?.score?.prediction;

    // ORES classes map to our 0-100 scale
    const oresMap: Record<string, number> = {
      FA: 100, // Featured Article
      GA: 88,  // Good Article
      B: 72,
      C: 50,
      Start: 28,
      Stub: 10,
    };
    return oresMap[prediction ?? ''] ?? 10;
  } catch {
    return 10;
  }
}
