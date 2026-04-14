export interface CategoryTagRule {
  pattern: RegExp;
  tags: string[];
}

export const CATEGORY_TAG_RULES: CategoryTagRule[] = [
  // Type — Animals
  { pattern: /\banimals?\b/i, tags: ['animal'] },
  { pattern: /\bmammals?\b/i, tags: ['animal', 'mammal'] },
  { pattern: /\bbirds?\b/i, tags: ['animal', 'bird'] },
  { pattern: /\breptiles?\b/i, tags: ['animal', 'reptile'] },
  { pattern: /\bfish\b/i, tags: ['animal', 'fish'] },
  { pattern: /\binsects?\b/i, tags: ['animal', 'insect'] },
  { pattern: /\barachnids?\b/i, tags: ['animal', 'insect', 'arachnid'] },
  { pattern: /\bamphibians?\b/i, tags: ['animal', 'amphibian'] },

  // Traits — Animal traits
  { pattern: /\bpredators?\b/i, tags: ['predator'] },
  { pattern: /\bherbivores?\b/i, tags: ['herbivore'] },
  { pattern: /\bomnivores?\b/i, tags: ['omnivore'] },
  { pattern: /\bcarnivores?\b/i, tags: ['carnivore', 'predator'] },
  { pattern: /\bfelines?\b|felidae/i, tags: ['animal', 'mammal', 'feline', 'predator'] },
  { pattern: /\bcanines?\b|canidae/i, tags: ['animal', 'mammal', 'canine'] },
  { pattern: /\bprimates?\b/i, tags: ['animal', 'mammal', 'primate'] },

  // Type — Humans / People
  { pattern: /\b(people|persons?|humans?|individuals?)\b/i, tags: ['human'] },
  { pattern: /\bpoliticians?\b/i, tags: ['human', 'politics'] },
  { pattern: /\bscientists?\b/i, tags: ['human', 'science'] },
  { pattern: /\bphilosophers?\b/i, tags: ['human', 'philosophy'] },
  { pattern: /\bartists?\b/i, tags: ['human', 'art'] },
  { pattern: /\bwriters?\b|\bauthors?\b/i, tags: ['human', 'literature'] },
  { pattern: /\bathletes?\b|\bsportspeople\b/i, tags: ['human', 'sport'] },
  { pattern: /\bmilitary\b|\bsoldiers?\b|\bgeneral\b/i, tags: ['human', 'war', 'military'] },
  { pattern: /\bmonarchs?\b|\bkings?\b|\bqueens?\b|\brulers?\b/i, tags: ['human', 'politics', 'royalty'] },
  { pattern: /\bphysicists?\b/i, tags: ['human', 'science', 'physics'] },
  { pattern: /\bchemists?\b/i, tags: ['human', 'science', 'chemistry'] },
  { pattern: /\bbiologists?\b/i, tags: ['human', 'science', 'biology'] },
  { pattern: /\bmathematicians?\b/i, tags: ['human', 'science', 'mathematics'] },
  { pattern: /\beconomists?\b/i, tags: ['human', 'science', 'economics'] },

  // Type — Events
  { pattern: /\bwars?\b|\bbattles?\b|\bconflicts?\b/i, tags: ['event', 'war'] },
  { pattern: /\brevolutions?\b/i, tags: ['event', 'politics', 'war'] },
  { pattern: /\btreat(ies|y)\b/i, tags: ['event', 'politics'] },
  { pattern: /\belections?\b/i, tags: ['event', 'politics'] },
  { pattern: /\bdisasters?\b|\bearthquakes?\b|\bfloods?\b/i, tags: ['event', 'disaster'] },
  { pattern: /\bepidemi(c|cs|ology)\b|\bpandemi(c|cs)\b/i, tags: ['event', 'science', 'disease'] },
  { pattern: /\bsiege(s)?\b/i, tags: ['event', 'war', 'military'] },
  { pattern: /\bassassination(s)?\b/i, tags: ['event', 'politics', 'war'] },

  // Domain — Science & Technology
  { pattern: /\bscience\b|\bscientific\b/i, tags: ['science'] },
  { pattern: /\bphysics\b/i, tags: ['science', 'physics'] },
  { pattern: /\bchemistry\b/i, tags: ['science', 'chemistry'] },
  { pattern: /\bbiology\b/i, tags: ['science', 'biology'] },
  { pattern: /\bmathematics?\b|\balgebra\b|\bcalculus\b|\bgeometry\b/i, tags: ['science', 'mathematics'] },
  { pattern: /\bastronomy\b|\bastrophysics\b|\bcosmology\b/i, tags: ['science', 'astronomy'] },
  { pattern: /\btechnology\b|\bcomputing\b|\bsoftware\b/i, tags: ['science', 'technology'] },
  { pattern: /\bmedicine\b|\bmedical\b/i, tags: ['science', 'medicine'] },
  { pattern: /\bengineering\b/i, tags: ['science', 'technology', 'engineering'] },

  // Domain — Economics
  { pattern: /\beconomics?\b|\beconomy\b/i, tags: ['economics'] },
  { pattern: /\bfinance\b|\bbanking\b/i, tags: ['economics', 'finance'] },
  { pattern: /\btrade\b|\bcommerce\b/i, tags: ['economics', 'trade'] },
  { pattern: /\bcapitalism\b|\bsocialism\b|\bcommunism\b/i, tags: ['economics', 'politics', 'ideology'] },

  // Domain — Politics
  { pattern: /\bpolitics?\b|\bpolitical\b/i, tags: ['politics'] },
  { pattern: /\bdemocracy\b|\bauthoritarianism\b|\bmonarchy\b/i, tags: ['politics', 'government'] },
  { pattern: /\blaw\b|\blegal\b|\bjudiciary\b/i, tags: ['politics', 'law'] },

  // Domain — Military
  { pattern: /\bmilitary\b|\barmed forces\b|\bweapons?\b/i, tags: ['military'] },
  { pattern: /\bnavy\b|\bnaval\b/i, tags: ['military', 'navy'] },
  { pattern: /\bair force\b|\baviation\b|\baircraft\b/i, tags: ['military', 'aviation'] },

  // Domain — Religion & Philosophy
  { pattern: /\breligion\b|\breligious\b/i, tags: ['religion'] },
  { pattern: /\bchristianity\b|\bislam\b|\bhinduism\b|\bbuddhism\b|\bjudaism\b/i, tags: ['religion'] },
  { pattern: /\bphilosophy\b|\bphilosophical\b/i, tags: ['philosophy'] },
  { pattern: /\bmythology\b/i, tags: ['mythology'] },

  // Domain — Art & Culture
  { pattern: /\blit(erature|erary)\b|\bnovels?\b|\bpoetry\b/i, tags: ['literature', 'art'] },
  { pattern: /\bmusic\b|\bcomposers?\b|\bmusicians?\b/i, tags: ['music', 'art'] },
  { pattern: /\bpainting\b|\bsculpture\b|\barchitecture\b/i, tags: ['visual-art', 'art'] },
  { pattern: /\bfilm\b|\bcinema\b|\bmovies?\b/i, tags: ['film', 'art'] },
  { pattern: /\bsport(s)?\b|\bathletics\b/i, tags: ['sport'] },
  { pattern: /\bfootball\b|\bsoccer\b/i, tags: ['sport', 'football'] },
  { pattern: /\bolympic(s)?\b/i, tags: ['sport', 'olympics'] },

  // Region — Continents & Major Regions
  { pattern: /\bafrica\b/i, tags: ['africa'] },
  { pattern: /\beurope\b|\beuropean\b/i, tags: ['europe'] },
  { pattern: /\basia\b|\basian\b/i, tags: ['asia'] },
  { pattern: /\bnorth america\b/i, tags: ['north-america', 'america'] },
  { pattern: /\bsouth america\b|\blatin america\b/i, tags: ['south-america', 'america'] },
  { pattern: /\bmiddle east\b/i, tags: ['middle-east', 'asia'] },
  { pattern: /\bocean(ia)?\b|\bpacific\b/i, tags: ['oceania'] },
  { pattern: /\barctic\b|\bantarctic(a)?\b/i, tags: ['polar'] },

  // Region — Countries
  { pattern: /\bamerican\b|\bunited states\b|\busa\b/i, tags: ['north-america', 'america', 'usa'] },
  { pattern: /\bbritish\b|\bengland\b|\bunited kingdom\b|\buk\b/i, tags: ['europe', 'uk'] },
  { pattern: /\bfrench?\b|\bfrance\b/i, tags: ['europe', 'france'] },
  { pattern: /\bgerman(y)?\b/i, tags: ['europe', 'germany'] },
  { pattern: /\brussian?\b|\brussia\b|\bsoviet\b/i, tags: ['europe', 'asia', 'russia'] },
  { pattern: /\bchinese?\b|\bchina\b/i, tags: ['asia', 'china'] },
  { pattern: /\bindian?\b|\bindia\b/i, tags: ['asia', 'india'] },
  { pattern: /\bjapanese?\b|\bjapan\b/i, tags: ['asia', 'japan'] },
  { pattern: /\barab\b|\barabic\b/i, tags: ['middle-east', 'arabic'] },
  { pattern: /\bpersian?\b|\biran\b/i, tags: ['middle-east', 'persia'] },
  { pattern: /\bgreek?\b|\bgreece\b/i, tags: ['europe', 'greece'] },
  { pattern: /\broman?\b|\brome\b/i, tags: ['europe', 'rome'] },
  { pattern: /\bspanish?\b|\bspain\b/i, tags: ['europe', 'spain'] },
  { pattern: /\bitalian?\b|\bitaly\b/i, tags: ['europe', 'italy'] },
  { pattern: /\bbrazilian?\b|\bbrazil\b/i, tags: ['south-america', 'brazil'] },
  { pattern: /\bafrican\b/i, tags: ['africa'] },
  { pattern: /\begypt(ian)?\b/i, tags: ['africa', 'middle-east', 'egypt'] },
];

export function categoriesToTags(categories: string[]): string[] {
  const tagSet = new Set<string>();
  for (const category of categories) {
    for (const rule of CATEGORY_TAG_RULES) {
      if (rule.pattern.test(category)) {
        rule.tags.forEach(t => tagSet.add(t));
      }
    }
  }
  return Array.from(tagSet);
}
