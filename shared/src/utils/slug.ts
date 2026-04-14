export function normalizeWikiTitle(title: string): string {
  return title.trim().replace(/ /g, '_');
}

export function wikiTitleToSlug(title: string): string {
  return encodeURIComponent(normalizeWikiTitle(title));
}
