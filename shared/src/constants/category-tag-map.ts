export interface CategoryTagRule {
  pattern: RegExp;
  tags: string[];
}

export const CATEGORY_TAG_RULES: CategoryTagRule[] = [

  // ── ANIMALS ───────────────────────────────────────────────────────────────
  { pattern: /\banimals?\b/i,                                   tags: ['animal'] },
  { pattern: /\bmammals?\b/i,                                   tags: ['animal', 'mammal'] },
  { pattern: /\bbirds?\b|\baves\b|\bpasserines?\b/i,            tags: ['animal', 'bird'] },
  { pattern: /\breptiles?\b/i,                                  tags: ['animal', 'reptile'] },
  { pattern: /\bfish\b|\bfishes\b|\bpisces\b/i,                 tags: ['animal', 'fish'] },
  { pattern: /\binsects?\b/i,                                   tags: ['animal', 'insect'] },
  { pattern: /\barachnids?\b|\bspiders?\b|\bscorpions?\b/i,     tags: ['animal', 'insect', 'arachnid'] },
  { pattern: /\bamphibians?\b|\bfrogs?\b|\btoads?\b/i,          tags: ['animal', 'amphibian'] },
  { pattern: /\bsharks?\b|\bwhales?\b|\bdolphins?\b/i,          tags: ['animal', 'fish', 'marine'] },
  { pattern: /\bmolluscs?\b|\boctop(us|odes)\b|\bsquid\b/i,     tags: ['animal', 'marine'] },
  { pattern: /\bcrustaceans?\b/i,                               tags: ['animal', 'marine'] },

  // Animal traits
  { pattern: /\bpredators?\b/i,                                 tags: ['predator'] },
  { pattern: /\bherbivores?\b/i,                                tags: ['herbivore'] },
  { pattern: /\bomnivores?\b/i,                                 tags: ['omnivore'] },
  { pattern: /\bcarnivores?\b/i,                                tags: ['carnivore', 'predator'] },
  { pattern: /\bfelines?\b|felidae/i,                           tags: ['animal', 'mammal', 'feline', 'predator'] },
  { pattern: /\bcanines?\b|canidae/i,                           tags: ['animal', 'mammal', 'canine'] },
  { pattern: /\bprimates?\b/i,                                  tags: ['animal', 'mammal', 'primate'] },
  { pattern: /\bvenomous\b|\bpoisonous\b/i,                     tags: ['toxic', 'predator'] },
  { pattern: /\bscavengers?\b/i,                                tags: ['predator', 'animal'] },

  // ── HUMANS / PEOPLE ───────────────────────────────────────────────────────
  { pattern: /\b(people|persons?|humans?|individuals?|biography)\b/i, tags: ['human'] },
  { pattern: /\bborn \d{4}\b|\b\d{4} births?\b/i,              tags: ['human'] },
  { pattern: /\bpoliticians?\b/i,                               tags: ['human', 'politics'] },
  { pattern: /\bscientists?\b|\bresearchers?\b/i,               tags: ['human', 'science'] },
  { pattern: /\bphilosophers?\b/i,                              tags: ['human', 'philosophy'] },
  { pattern: /\bartists?\b|\bpainters?\b/i,                     tags: ['human', 'art'] },
  { pattern: /\bwriters?\b|\bauthors?\b|\bnovelists?\b/i,       tags: ['human', 'literature'] },
  { pattern: /\bathletes?\b|\bsportspeople\b|\bsportsman\b/i,   tags: ['human', 'sport'] },
  { pattern: /\bmilitary\b|\bsoldiers?\b|\bgeneral(s)?\b|\badmirals?\b/i, tags: ['human', 'war', 'military'] },
  { pattern: /\bmonarchs?\b|\bkings?\b|\bqueens?\b|\brulers?\b|\bpharaohs?\b/i, tags: ['human', 'politics', 'royalty'] },
  { pattern: /\bphysicists?\b/i,                                tags: ['human', 'science', 'physics'] },
  { pattern: /\bchemists?\b/i,                                  tags: ['human', 'science', 'chemistry'] },
  { pattern: /\bbiologists?\b/i,                                tags: ['human', 'science', 'biology'] },
  { pattern: /\bmathematicians?\b/i,                            tags: ['human', 'science', 'mathematics'] },
  { pattern: /\beconomists?\b/i,                                tags: ['human', 'science', 'economics'] },
  { pattern: /\bastronomers?\b/i,                               tags: ['human', 'science', 'astronomy'] },
  { pattern: /\barchitects?\b/i,                                tags: ['human', 'art', 'architecture'] },
  { pattern: /\bcomposers?\b|\bmusicians?\b/i,                  tags: ['human', 'music'] },
  { pattern: /\bexplorers?\b|\bnavigators?\b/i,                 tags: ['human', 'discovery'] },
  { pattern: /\binventors?\b/i,                                 tags: ['human', 'science', 'technology'] },
  { pattern: /\bwarriors?\b|\bknights?\b|\bsamurai\b|\bgladiators?\b/i, tags: ['human', 'warrior', 'war'] },
  { pattern: /\bnobility\b|\baristocracy\b|\bnobles?\b|\bdukes?\b|\bbarons?\b/i, tags: ['human', 'noble', 'royalty'] },

  // ── EVENTS ────────────────────────────────────────────────────────────────
  { pattern: /\bwars?\b|\bbattles?\b|\bconflicts?\b/i,          tags: ['event', 'war'] },
  { pattern: /\brevolutions?\b/i,                               tags: ['event', 'politics', 'war'] },
  { pattern: /\btreat(ies|y)\b/i,                               tags: ['event', 'politics'] },
  { pattern: /\belections?\b/i,                                 tags: ['event', 'politics'] },
  { pattern: /\bdisasters?\b|\bearthquakes?\b|\bfloods?\b|\bstorms?\b/i, tags: ['event', 'disaster'] },
  { pattern: /\bepidemi(c|cs|ology)\b|\bpandemi(c|cs)\b/i,     tags: ['event', 'science', 'disease'] },
  { pattern: /\bsiege(s)?\b/i,                                  tags: ['event', 'war', 'military'] },
  { pattern: /\bassassination(s)?\b/i,                          tags: ['event', 'politics', 'war'] },
  { pattern: /\bfamines?\b/i,                                   tags: ['event', 'disaster'] },
  { pattern: /\bexplosions?\b|\baccidents?\b/i,                 tags: ['event', 'disaster'] },
  { pattern: /\bvolcanic eruptions?\b/i,                        tags: ['event', 'disaster', 'volcanic'] },

  // ── GEOGRAPHY — SETTLEMENTS ────────────────────────────────────────────────
  { pattern: /\bvillages?\b/i,                                  tags: ['settlement', 'village'] },
  { pattern: /\bhamlets?\b/i,                                   tags: ['settlement', 'village'] },
  { pattern: /\btowns?\b|\btownships?\b/i,                      tags: ['settlement', 'town'] },
  { pattern: /\bcit(y|ies)\b/i,                                 tags: ['settlement', 'city'] },
  { pattern: /\bcapitals?\b/i,                                  tags: ['settlement', 'city', 'politics'] },
  { pattern: /\bmunicipalities\b|\bmunicipality\b/i,            tags: ['settlement'] },
  { pattern: /\bcommunes?\b/i,                                  tags: ['settlement', 'village'] },
  { pattern: /\bboroughs?\b/i,                                  tags: ['settlement', 'town'] },
  { pattern: /\bsuburbs?\b/i,                                   tags: ['settlement', 'city'] },
  { pattern: /\bdistricts?\b/i,                                 tags: ['settlement'] },
  { pattern: /\bprovinces?\b|\bregions?\b/i,                    tags: ['settlement'] },

  // ── GEOGRAPHY — NATURE & TERRAIN ──────────────────────────────────────────
  { pattern: /\bmountains?\b|\bpeaks?\b|\bsummits?\b|\balpine\b|\bhills?\b/i, tags: ['mountain', 'nature'] },
  { pattern: /\balps\b|\bandes\b|\bhimalay(a|as)\b|\brocky mountains\b/i, tags: ['mountain', 'nature'] },
  { pattern: /\brivers?\b|\bstreams?\b|\btributaries?\b|\bcreeks?\b/i, tags: ['river', 'water', 'nature'] },
  { pattern: /\blakes?\b|\breservoirs?\b|\bponds?\b/i,          tags: ['lake', 'water', 'nature'] },
  { pattern: /\bislands?\b|\barchipelago\b|\bisles?\b|\batoll\b/i, tags: ['island', 'nature'] },
  { pattern: /\bforests?\b|\bwoodlands?\b|\bjungles?\b|\brainforests?\b/i, tags: ['forest', 'nature'] },
  { pattern: /\bdeserts?\b|\bdunes?\b|\bsahara\b|\bgobi\b|\barid\b/i, tags: ['desert', 'nature'] },
  { pattern: /\boceans?\b|\bseas?\b/i,                          tags: ['ocean', 'water', 'nature'] },
  { pattern: /\bcoasts?\b|\bshores?\b|\bbeaches?\b|\bbays?\b|\bgulfs?\b/i, tags: ['coast', 'nature'] },
  { pattern: /\bvalleys?\b|\bbasins?\b|\bgorges?\b|\bcanyons?\b/i, tags: ['valley', 'nature'] },
  { pattern: /\bplains?\b|\bsteppes?\b|\bprairies?\b|\bsavannas?\b/i, tags: ['plain', 'nature'] },
  { pattern: /\bvolcano(es|s)?\b|\bvolcanic\b/i,               tags: ['volcanic', 'fire', 'nature'] },
  { pattern: /\bglaciers?\b|\bice (sheet|cap|field)\b/i,        tags: ['polar', 'water', 'nature'] },
  { pattern: /\bcaves?\b|\bcaverns?\b/i,                        tags: ['nature'] },
  { pattern: /\bwetlands?\b|\bswamps?\b|\bmarshes?\b/i,         tags: ['water', 'nature'] },
  { pattern: /\breefs?\b|\bcoral\b/i,                           tags: ['marine', 'ocean', 'nature'] },

  // ── SCIENCE & TECHNOLOGY ──────────────────────────────────────────────────
  { pattern: /\bscience\b|\bscientific\b/i,                     tags: ['science'] },
  { pattern: /\bphysics\b/i,                                    tags: ['science', 'physics'] },
  { pattern: /\bchemistry\b|\bchemical\b/i,                     tags: ['science', 'chemistry'] },
  { pattern: /\bbiology\b|\bbiological\b/i,                     tags: ['science', 'biology'] },
  { pattern: /\bmathematics?\b|\balgebra\b|\bcalculus\b|\bgeometry\b|\bstatistics\b/i, tags: ['science', 'mathematics'] },
  { pattern: /\bastronomy\b|\bastrophysics\b|\bcosmology\b/i,   tags: ['science', 'astronomy'] },
  { pattern: /\btechnology\b|\bcomputing\b|\bsoftware\b|\binternet\b/i, tags: ['science', 'technology'] },
  { pattern: /\bmedicine\b|\bmedical\b|\bpharmac/i,             tags: ['science', 'medicine'] },
  { pattern: /\bengineering\b/i,                                tags: ['science', 'technology', 'engineering'] },
  { pattern: /\bgeology\b|\bgeological\b|\bminerals?\b/i,       tags: ['science', 'earth'] },
  { pattern: /\becology\b|\benvironmental\b/i,                  tags: ['science', 'biology', 'nature'] },
  { pattern: /\bnuclear\b|\batomic\b|\bradioactive\b|\bfission\b|\bfusion\b/i, tags: ['nuclear', 'science', 'physics'] },
  { pattern: /\btoxic\b|\bpoisonous\b|\bvenomous\b/i,           tags: ['toxic'] },
  { pattern: /\bexplosives?\b|\bgunpowder\b|\bbomb\b/i,         tags: ['toxic', 'fire', 'military'] },

  // ── SPACE & COSMOS ────────────────────────────────────────────────────────
  { pattern: /\bspace\b|\bspaceflight\b|\bspacecraft\b|\bcosmos\b/i, tags: ['space'] },
  { pattern: /\bplanets?\b|\bplanetary\b|\bsolar system\b/i,    tags: ['space', 'planet'] },
  { pattern: /\bstars?\b|\bstellar\b|\bsun\b|\bsolar\b/i,       tags: ['space', 'star'] },
  { pattern: /\bgalax(y|ies)\b|\bgalactic\b|\bmilky way\b/i,    tags: ['space', 'galaxy'] },
  { pattern: /\bcomets?\b|\basteroids?\b|\bmeteors?\b/i,         tags: ['space'] },
  { pattern: /\bblack holes?\b|\bneutron stars?\b/i,             tags: ['space', 'star', 'physics'] },
  { pattern: /\btelescopes?\b|\bobservatories?\b/i,              tags: ['space', 'astronomy'] },

  // ── ECONOMICS ─────────────────────────────────────────────────────────────
  { pattern: /\beconomics?\b|\beconomy\b/i,                     tags: ['economics'] },
  { pattern: /\bfinance\b|\bbanking\b|\bcurrency\b/i,           tags: ['economics', 'finance'] },
  { pattern: /\btrade\b|\bcommerce\b|\bmerchants?\b/i,          tags: ['economics', 'trade'] },
  { pattern: /\bcapitalism\b|\bsocialism\b|\bcommunism\b/i,     tags: ['economics', 'politics', 'ideology'] },
  { pattern: /\bagriculture\b|\bfarming\b|\bcrops?\b/i,         tags: ['economics', 'food', 'nature'] },
  { pattern: /\bmining\b|\bmines?\b|\bores?\b/i,                tags: ['economics', 'earth'] },
  { pattern: /\bmanufacturing\b|\bindustry\b|\bfactories?\b/i,  tags: ['economics', 'technology'] },

  // ── POLITICS & GOVERNMENT ─────────────────────────────────────────────────
  { pattern: /\bpolitics?\b|\bpolitical\b/i,                    tags: ['politics'] },
  { pattern: /\bdemocracy\b|\bdemocratic\b/i,                   tags: ['politics', 'democracy'] },
  { pattern: /\bauthoritarianism\b|\bdictatorships?\b/i,        tags: ['politics', 'military'] },
  { pattern: /\bmonarchy\b|\bmonarchies\b/i,                    tags: ['politics', 'royalty'] },
  { pattern: /\brepublic(s|an)?\b/i,                            tags: ['politics', 'republic'] },
  { pattern: /\bempires?\b|\bimperial\b|\bemperors?\b/i,        tags: ['politics', 'empire'] },
  { pattern: /\bcommunist\b|\bmarxist\b|\bbolshevik\b/i,        tags: ['politics', 'communist'] },
  { pattern: /\blaw\b|\blegal\b|\bjudiciary\b|\bcourts?\b/i,    tags: ['politics', 'law'] },
  { pattern: /\bcolonial\b|\bcolonialism\b|\bcolonies\b/i,      tags: ['politics', 'war', 'empire'] },

  // ── MILITARY ──────────────────────────────────────────────────────────────
  { pattern: /\bmilitary\b|\barmed forces\b|\bweapons?\b/i,     tags: ['military'] },
  { pattern: /\bnavy\b|\bnaval\b|\bfleet\b/i,                   tags: ['military', 'navy', 'maritime'] },
  { pattern: /\bair force\b|\baviation\b|\baircraft\b|\bjet\b/i, tags: ['military', 'aviation', 'air'] },
  { pattern: /\bcavalry\b|\binfantry\b|\barmy\b/i,              tags: ['military', 'warrior'] },
  { pattern: /\bfortresses?\b|\bcastles?\b|\bcitadels?\b/i,     tags: ['military', 'architecture'] },

  // ── RELIGION & PHILOSOPHY ─────────────────────────────────────────────────
  { pattern: /\breligion\b|\breligious\b/i,                     tags: ['religion'] },
  { pattern: /\bchristianity\b|\bcatholic\b|\bprotestant\b|\borthodox\b/i, tags: ['religion'] },
  { pattern: /\bislam\b|\bmuslim\b|\bquran\b/i,                 tags: ['religion', 'middle-east'] },
  { pattern: /\bhinduism\b|\bhindu\b/i,                         tags: ['religion', 'asia', 'india'] },
  { pattern: /\bbuddhism\b|\bbuddh/i,                           tags: ['religion', 'asia'] },
  { pattern: /\bjudaism\b|\bjewish\b/i,                         tags: ['religion', 'middle-east'] },
  { pattern: /\bphilosophy\b|\bphilosophical\b/i,               tags: ['philosophy'] },
  { pattern: /\bmythology\b|\bmyths?\b|\blegends?\b/i,          tags: ['mythology'] },
  { pattern: /\bfolklore\b|\bfairy tales?\b|\bfables?\b/i,      tags: ['folklore', 'mythology'] },
  { pattern: /\balchemy\b|\boccult\b|\bsupernatural\b|\bwitchcraft\b/i, tags: ['magic', 'folklore'] },
  { pattern: /\btemplars?\b|\bcrusad/i,                         tags: ['religion', 'war', 'medieval'] },

  // ── ART & CULTURE ─────────────────────────────────────────────────────────
  { pattern: /\blit(erature|erary)\b|\bnovels?\b|\bpoetry\b/i,  tags: ['literature', 'art'] },
  { pattern: /\bmusic\b|\bopera\b|\borchestra\b/i,              tags: ['music', 'art'] },
  { pattern: /\bpainting\b|\bsculpture\b/i,                     tags: ['visual-art', 'art'] },
  { pattern: /\barchitecture\b|\bbuildings?\b|\bstructures?\b/i, tags: ['architecture', 'art'] },
  { pattern: /\bcathedrals?\b|\bchurches?\b|\btemples?\b|\bmosques?\b/i, tags: ['architecture', 'religion'] },
  { pattern: /\bcastles?\b|\bpalaces?\b|\bforts?\b/i,           tags: ['architecture', 'medieval'] },
  { pattern: /\bfilm\b|\bcinema\b|\bmovies?\b/i,                tags: ['film', 'art'] },
  { pattern: /\bgames?\b|\bvideo games?\b/i,                    tags: ['technology', 'art'] },
  { pattern: /\bcuisine\b|\bfood\b|\bcooking\b|\bgastrono/i,    tags: ['food'] },
  { pattern: /\beducation\b|\buniversit(y|ies)\b|\bcollege\b/i, tags: ['education', 'science'] },
  { pattern: /\blanguages?\b|\blinguistics?\b|\bdialects?\b/i,  tags: ['language'] },

  // ── SPORT ─────────────────────────────────────────────────────────────────
  { pattern: /\bsport(s)?\b|\bathletics\b/i,                    tags: ['sport'] },
  { pattern: /\bfootball\b|\bsoccer\b/i,                        tags: ['sport', 'football'] },
  { pattern: /\bolympic(s)?\b/i,                                tags: ['sport', 'olympics'] },
  { pattern: /\bbasketball\b/i,                                  tags: ['sport'] },
  { pattern: /\btennis\b|\bgolf\b|\bboxing\b|\bwrestling\b/i,   tags: ['sport'] },
  { pattern: /\bswimming\b|\bcycling\b|\brunning\b/i,           tags: ['sport'] },
  { pattern: /\bmartial arts\b|\bkarate\b|\bjudo\b|\bkung fu\b/i, tags: ['sport', 'warrior'] },

  // ── MARITIME ──────────────────────────────────────────────────────────────
  { pattern: /\bmaritime\b|\bsailing\b|\bseafaring\b/i,         tags: ['maritime'] },
  { pattern: /\bships?\b|\bvessels?\b|\bboats?\b|\bfleet\b/i,   tags: ['maritime'] },
  { pattern: /\bpirates?\b|\bprivateers?\b/i,                   tags: ['maritime', 'war'] },
  { pattern: /\bharbours?\b|\bports?\b|\bdocks?\b/i,            tags: ['maritime', 'trade'] },
  { pattern: /\bfishing\b|\bfisheries\b/i,                      tags: ['maritime', 'food'] },

  // ── DISCOVERY & EXPLORATION ────────────────────────────────────────────────
  { pattern: /\bexploration\b|\bexplorers?\b|\bexpeditions?\b/i, tags: ['discovery'] },
  { pattern: /\bgeographic\b|\bcartography\b|\bmaps?\b/i,        tags: ['discovery', 'science'] },

  // ── ERA ───────────────────────────────────────────────────────────────────
  { pattern: /\bprehistoric\b|\bpaleolithic\b|\bneolithic\b|\bstone age\b|\bbronze age\b/i, tags: ['prehistoric'] },
  { pattern: /\bancient\b|\bantiquit(y|ies)\b|\bclassical period\b/i, tags: ['ancient'] },
  { pattern: /\bmedieval\b|\bmiddle ages?\b|\bfeudam?\b|\bgothic period\b/i, tags: ['medieval'] },
  { pattern: /\brenaissance\b/i,                                 tags: ['medieval', 'art', 'science'] },
  { pattern: /\b(18th|19th|20th|21st) century\b/i,              tags: ['modern'] },
  { pattern: /\bworld war\b|\bwwi\b|\bwwii\b/i,                 tags: ['war', 'modern'] },

  // ── REGION — CONTINENTS ───────────────────────────────────────────────────
  { pattern: /\bafrica\b|\bafrican\b/i,                          tags: ['africa'] },
  { pattern: /\beurope\b|\beuropean\b/i,                         tags: ['europe'] },
  { pattern: /\basia\b|\basian\b/i,                              tags: ['asia'] },
  { pattern: /\bnorth america\b/i,                               tags: ['north-america', 'america'] },
  { pattern: /\bsouth america\b|\blatin america\b/i,             tags: ['south-america', 'america'] },
  { pattern: /\bmiddle east\b|\bnear east\b/i,                   tags: ['middle-east', 'asia'] },
  { pattern: /\bocean(ia)?\b|\bpacific islands?\b|\bmelanesia\b|\bpolynesia\b/i, tags: ['oceania'] },
  { pattern: /\barctic\b|\bantarctic(a)?\b|\bpolar regions?\b/i, tags: ['polar'] },
  { pattern: /\bcaribbean\b/i,                                   tags: ['north-america', 'island'] },
  { pattern: /\bbalkan(s)?\b/i,                                  tags: ['europe'] },
  { pattern: /\bscandinavian?\b|\bnordic\b/i,                    tags: ['europe', 'scandinavia'] },

  // ── REGION — COUNTRIES (EXISTING + EXPANDED) ─────────────────────────────
  { pattern: /\bamerican\b|\bunited states\b|\busa\b/i,          tags: ['north-america', 'america', 'usa'] },
  { pattern: /\bbritish\b|\bengland\b|\bunited kingdom\b|\buk\b|\bwelsh\b|\bscottish\b/i, tags: ['europe', 'uk'] },
  { pattern: /\bfrench?\b|\bfrance\b/i,                          tags: ['europe', 'france'] },
  { pattern: /\bgerman(y|ic)?\b/i,                               tags: ['europe', 'germany'] },
  { pattern: /\brussian?\b|\brussia\b|\bsoviet\b/i,              tags: ['europe', 'asia', 'russia'] },
  { pattern: /\bchinese?\b|\bchina\b/i,                          tags: ['asia', 'china'] },
  { pattern: /\bindian?\b|\bindia\b/i,                           tags: ['asia', 'india'] },
  { pattern: /\bjapanese?\b|\bjapan\b/i,                         tags: ['asia', 'japan'] },
  { pattern: /\barab\b|\barabic\b/i,                             tags: ['middle-east', 'arabic'] },
  { pattern: /\bpersian?\b|\biran(ian)?\b/i,                     tags: ['middle-east', 'persia'] },
  { pattern: /\bgreek?\b|\bgreece\b|\bhellenic\b/i,              tags: ['europe', 'greece', 'ancient'] },
  { pattern: /\broman?\b|\brome\b|\broman empire\b/i,            tags: ['europe', 'rome', 'ancient'] },
  { pattern: /\bspanish?\b|\bspain\b|\biberian\b/i,              tags: ['europe', 'spain'] },
  { pattern: /\bitalian?\b|\bitaly\b/i,                          tags: ['europe', 'italy'] },
  { pattern: /\bbrazilian?\b|\bbrazil\b/i,                       tags: ['south-america', 'brazil'] },
  { pattern: /\begypt(ian)?\b/i,                                 tags: ['africa', 'middle-east', 'egypt', 'ancient'] },
  { pattern: /\bpolish\b|\bpoland\b/i,                           tags: ['europe', 'poland'] },
  { pattern: /\bsilesian\b|\bsilesia\b/i,                        tags: ['europe', 'poland'] },
  { pattern: /\bvoivodeship\b|\bvoivod/i,                        tags: ['europe', 'poland', 'settlement'] },
  { pattern: /\bgmina\b/i,                                       tags: ['europe', 'poland', 'settlement', 'village'] },
  { pattern: /\bczech(oslav)?/i,                                 tags: ['europe', 'czech'] },
  { pattern: /\baustrian?\b|\baustria\b/i,                       tags: ['europe', 'austria'] },
  { pattern: /\bhungar(y|ian)\b/i,                               tags: ['europe', 'hungary'] },
  { pattern: /\bromanian?\b|\bromania\b/i,                       tags: ['europe', 'romania'] },
  { pattern: /\bukrainian?\b|\bukraine\b/i,                      tags: ['europe', 'ukraine'] },
  { pattern: /\bbulgarian?\b|\bbulgaria\b/i,                     tags: ['europe', 'bulgaria'] },
  { pattern: /\bserbian?\b|\bserbia\b|\byugoslav/i,              tags: ['europe', 'serbia'] },
  { pattern: /\bcroatian?\b|\bcroatia\b/i,                       tags: ['europe', 'croatia'] },
  { pattern: /\bswedish\b|\bsweden\b/i,                          tags: ['europe', 'scandinavia'] },
  { pattern: /\bnorwegian?\b|\bnorway\b|\bnorse\b|\bviking/i,    tags: ['europe', 'scandinavia'] },
  { pattern: /\bdanish\b|\bdenmark\b/i,                          tags: ['europe', 'scandinavia'] },
  { pattern: /\bfinnish\b|\bfinland\b/i,                         tags: ['europe', 'scandinavia'] },
  { pattern: /\bdutch\b|\bnetherlands\b|\bholland\b/i,           tags: ['europe', 'netherlands'] },
  { pattern: /\bbelgian?\b|\bbelgium\b/i,                        tags: ['europe', 'belgium'] },
  { pattern: /\bportuguese?\b|\bportugal\b/i,                    tags: ['europe', 'portugal'] },
  { pattern: /\bturkish\b|\bturkey\b|\bottoman\b/i,              tags: ['europe', 'asia', 'turkey'] },
  { pattern: /\bisraeli?\b|\bisrael\b|\bhebrew\b/i,              tags: ['middle-east', 'israel'] },
  { pattern: /\baustralian?\b|\baustralia\b/i,                   tags: ['oceania', 'australia'] },
  { pattern: /\bcanadian?\b|\bcanada\b/i,                        tags: ['north-america', 'canada'] },
  { pattern: /\bmexican?\b|\bmexico\b/i,                         tags: ['north-america', 'mexico'] },
  { pattern: /\bkorean?\b|\bkorea\b/i,                           tags: ['asia', 'korea'] },
  { pattern: /\bvietnamese?\b|\bvietnam\b/i,                     tags: ['asia', 'southeast-asia'] },
  { pattern: /\bthai(land)?\b/i,                                 tags: ['asia', 'southeast-asia'] },
  { pattern: /\bindonesian?\b|\bindonesia\b/i,                   tags: ['asia', 'southeast-asia', 'island'] },
  { pattern: /\bphilippine\b|\bfilipino\b/i,                     tags: ['asia', 'southeast-asia', 'island'] },
  { pattern: /\bmalaysian?\b|\bmalaysia\b/i,                     tags: ['asia', 'southeast-asia'] },
  { pattern: /\bnigerian?\b|\bnigeria\b/i,                       tags: ['africa'] },
  { pattern: /\bkenyan?\b|\bkenya\b/i,                           tags: ['africa'] },
  { pattern: /\bethiopian?\b|\bethiopia\b/i,                     tags: ['africa'] },
  { pattern: /\bargentinian?\b|\bargentina\b/i,                  tags: ['south-america'] },
  { pattern: /\bcolombian?\b|\bcolombia\b/i,                     tags: ['south-america'] },
  { pattern: /\bchilean?\b|\bchile\b/i,                          tags: ['south-america'] },
  { pattern: /\bperuvian?\b|\bperu\b|\bincas?\b/i,              tags: ['south-america'] },
  { pattern: /\baztec\b|\bmayan?\b/i,                            tags: ['north-america', 'ancient'] },
  { pattern: /\bviking\b|\bnorse\b/i,                            tags: ['europe', 'scandinavia', 'warrior'] },
  { pattern: /\bceltic\b|\bcelts?\b/i,                           tags: ['europe', 'ancient'] },
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
