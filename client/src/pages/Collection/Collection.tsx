import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState, useOpenPityPack } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { PackOpener } from '../../components/PackOpener/PackOpener.js';
import { usePackStore } from '../../stores/packStore.js';
import { api } from '../../lib/api.js';
import type { UserCard } from '@wikibattler/shared';
import type { QidNode } from '@wikibattler/shared';
import { PITY_SR_THRESHOLD, PITY_UR_THRESHOLD, QID_BLOCKLIST } from '@wikibattler/shared';
import styles from './Collection.module.css';

const ALL_RARITIES = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR'] as const;
const RARITY_IDX = Object.fromEntries(ALL_RARITIES.map((r, i) => [r, i]));

type SortField = 'total' | 'atk' | 'hp' | 'spd' | 'name' | 'rarity' | 'acquired';
type SortDir   = 'desc' | 'asc';

function modalQidTags(chain: QidNode[]): QidNode[] {
  const seen = new Set<string>();
  return chain
    .filter(n => !QID_BLOCKLIST.has(n.qid))
    .sort((a, b) => a.depth - b.depth)
    .filter(n => {
      if (!n.label || seen.has(n.label)) return false;
      seen.add(n.label);
      return true;
    });
}

function getCardTraits(uc: UserCard): string[] {
  const seen = new Set<string>();
  return (uc.card.qidChain ?? [])
    .filter(n => !QID_BLOCKLIST.has(n.qid))
    .sort((a, b) => a.depth - b.depth)
    .flatMap(n => (n.label ? [n.label] : []))
    .filter(label => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
}

export function Collection() {
  const { data: collection, isLoading } = useCollection();
  const {
    storedPacks,
    secondsUntilNext,
    pitySrAvailable,
    pityUrAvailable,
    pitySrProgress,
    pityUrProgress,
  } = usePackStore();

  const queryClient  = useQueryClient();
  const openPack     = useOpenPack();
  const openPityPack = useOpenPityPack();

  const [packOpenerOpen, setPackOpenerOpen] = useState(false);
  const [packCharging, setPackCharging]     = useState(false);
  const [pendingCards, setPendingCards]     = useState<UserCard[] | null>(null);
  const [selectedCard, setSelectedCard]     = useState<UserCard | null>(null);
  const [copiedShare, setCopiedShare]       = useState(false);
  const pollCancelRef = useRef(false);

  // Search / filter / sort state
  const [search, setSearch]               = useState('');
  const [enabledRarities, setEnabledRarities] = useState<Set<string>>(new Set(ALL_RARITIES));
  const [foilOnly, setFoilOnly]           = useState(false);
  const [sortField, setSortField]         = useState<SortField>('total');
  const [sortDir, setSortDir]             = useState<SortDir>('desc');
  const [selectedTraits, setSelectedTraits] = useState<Set<string>>(new Set());
  const [traitOpen, setTraitOpen]         = useState(false);
  const [traitSearch, setTraitSearch]     = useState('');
  const traitPopoverRef = useRef<HTMLDivElement>(null);
  const traitBtnRef     = useRef<HTMLButtonElement>(null);

  usePackState();

  // Close trait popover on outside click
  useEffect(() => {
    if (!traitOpen) return;
    function handler(e: MouseEvent) {
      if (
        traitPopoverRef.current && !traitPopoverRef.current.contains(e.target as Node) &&
        traitBtnRef.current     && !traitBtnRef.current.contains(e.target as Node)
      ) {
        setTraitOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [traitOpen]);

  const allTraits = useMemo(() => {
    if (!collection?.data) return [];
    const seen = new Set<string>();
    const traits: string[] = [];
    for (const uc of collection.data) {
      for (const t of getCardTraits(uc as UserCard)) {
        if (!seen.has(t)) { seen.add(t); traits.push(t); }
      }
    }
    return traits.sort((a, b) => a.localeCompare(b));
  }, [collection?.data]);

  const filteredCollection = useMemo<UserCard[]>(() => {
    if (!collection?.data) return [];
    const q = search.trim().toLowerCase();
    const allEnabled = enabledRarities.size === ALL_RARITIES.length;

    let result = (collection.data as UserCard[]).filter(uc => {
      if (!allEnabled && !enabledRarities.has(uc.card.rarity)) return false;
      if (foilOnly && !uc.isFoil) return false;
      if (selectedTraits.size > 0) {
        const traits = new Set(getCardTraits(uc));
        if (![...selectedTraits].some(t => traits.has(t))) return false;
      }
      if (q) {
        const inName   = uc.card.wikiTitle.toLowerCase().includes(q);
        const inExtract = (uc.card.wikiExtract ?? '').toLowerCase().includes(q);
        const inTraits  = getCardTraits(uc).some(t => t.toLowerCase().includes(q));
        if (!inName && !inExtract && !inTraits) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'total':
          diff = (a.card.attack + a.card.health + a.card.speed) - (b.card.attack + b.card.health + b.card.speed);
          break;
        case 'atk':     diff = a.card.attack - b.card.attack; break;
        case 'hp':      diff = a.card.health - b.card.health; break;
        case 'spd':     diff = a.card.speed  - b.card.speed;  break;
        case 'name':    diff = a.card.wikiTitle.localeCompare(b.card.wikiTitle); break;
        case 'rarity':  diff = (RARITY_IDX[a.card.rarity] ?? 0) - (RARITY_IDX[b.card.rarity] ?? 0); break;
        case 'acquired':
          diff = new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
          break;
      }
      return sortDir === 'desc' ? -diff : diff;
    });

    return result;
  }, [collection?.data, search, enabledRarities, foilOnly, sortField, sortDir, selectedTraits]);

  function toggleRarity(rarity: string) {
    setEnabledRarities(prev => {
      const allOn = prev.size === ALL_RARITIES.length;
      if (allOn) return new Set([rarity]);
      const next = new Set(prev);
      if (next.has(rarity) && next.size === 1) return new Set(ALL_RARITIES);
      if (next.has(rarity)) { next.delete(rarity); } else { next.add(rarity); }
      return next.size === ALL_RARITIES.length ? new Set(ALL_RARITIES) : next;
    });
  }

  function toggleTrait(trait: string) {
    setSelectedTraits(prev => {
      const next = new Set(prev);
      if (next.has(trait)) { next.delete(trait); } else { next.add(trait); }
      return next;
    });
  }

  function resetFilters() {
    setSearch('');
    setEnabledRarities(new Set(ALL_RARITIES));
    setFoilOnly(false);
    setSortField('total');
    setSortDir('desc');
    setSelectedTraits(new Set());
    setTraitSearch('');
  }

  const hasActiveFilters =
    search !== '' ||
    enabledRarities.size !== ALL_RARITIES.length ||
    foilOnly ||
    selectedTraits.size > 0 ||
    sortField !== 'total' ||
    sortDir !== 'desc';

  const visibleTraits = traitSearch
    ? allTraits.filter(t => t.toLowerCase().includes(traitSearch.toLowerCase()))
    : allTraits;

  async function handleOpenPack() {
    if (storedPacks < 1 || openPack.isPending) return;
    setPackOpenerOpen(true);
    setPackCharging(true);
    setPendingCards(null);
    pollCancelRef.current = false;

    try {
      const result = await openPack.mutateAsync();
      const userCards = result.cards as UserCard[];

      const allHaveQids = userCards.every(
        uc => (uc.card.qidChain as unknown[]).length > 0
      );
      if (allHaveQids || pollCancelRef.current) {
        setPendingCards(userCards);
        setPackCharging(false);
        return;
      }

      const cardIds = userCards.map(uc => uc.card.id).join(',');
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      const poll = async () => {
        if (pollCancelRef.current) return;
        attempts++;
        try {
          const { data } = await api.get<{
            data: { allReady: boolean; qidData: Record<string, QidNode[]> };
          }>(`/cards/qids-ready?ids=${cardIds}`);
          const resp = data.data;
          if (resp.allReady || attempts >= MAX_ATTEMPTS) {
            if (!pollCancelRef.current) {
              const enriched = userCards.map(uc => ({
                ...uc,
                card: {
                  ...uc.card,
                  qidChain: resp.qidData[uc.card.id] ?? uc.card.qidChain,
                },
              })) as UserCard[];
              setPendingCards(enriched);
              setPackCharging(false);
            }
          } else {
            setTimeout(poll, 1500);
          }
        } catch {
          if (attempts >= MAX_ATTEMPTS && !pollCancelRef.current) {
            setPendingCards(userCards);
            setPackCharging(false);
          } else if (!pollCancelRef.current) {
            setTimeout(poll, 1500);
          }
        }
      };

      setTimeout(poll, 1500);
    } catch {
      setPackOpenerOpen(false);
      setPackCharging(false);
      setPendingCards(null);
    }
  }

  function handleClosePackOpener() {
    pollCancelRef.current = true;
    setPackOpenerOpen(false);
    setPendingCards(null);
    setPackCharging(false);
    void queryClient.invalidateQueries({ queryKey: ['cards'] });
  }

  async function handleOpenPityPack(tier: 'SR' | 'UR') {
    try {
      const result = await openPityPack.mutateAsync(tier);
      setPackOpenerOpen(true);
      setPackCharging(false);
      setPendingCards([result.card as UserCard]);
    } catch { /* ignore */ }
  }

  async function handleShare(card: UserCard['card']) {
    const url = `https://en.wikipedia.org/wiki/${card.wikiSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `WikiBattler — ${card.wikiTitle}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch { /* user cancelled share */ }
  }

  const mm = Math.floor(secondsUntilNext / 60).toString().padStart(2, '0');
  const ss = (secondsUntilNext % 60).toString().padStart(2, '0');
  const srPct = (pitySrProgress / PITY_SR_THRESHOLD) * 100;
  const urPct = (pityUrProgress / PITY_UR_THRESHOLD) * 100;

  return (
    <div className={styles.page}>
      {/* Pack opener overlay */}
      {packOpenerOpen && (
        <PackOpener
          cards={pendingCards ?? []}
          isCharging={packCharging}
          onClose={handleClosePackOpener}
        />
      )}

      {/* ── Card detail modal ── */}
      {selectedCard && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedCard(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >✕</button>

            <h2 className={styles.modalCardName}>{selectedCard.card.wikiTitle}</h2>

            <div className={styles.modalMain}>
              <div className={styles.modalActions}>
                <a
                  className={styles.modalActionBtn}
                  href={`https://en.wikipedia.org/wiki/${selectedCard.card.wikiSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Wikipedia"
                >
                  <span className={styles.modalActionIcon}>🌐</span>
                  <span>Wiki</span>
                </a>
                <button
                  className={styles.modalActionBtn}
                  onClick={() => handleShare(selectedCard.card)}
                  title="Share card"
                >
                  <span className={styles.modalActionIcon}>
                    {copiedShare ? '✓' : '↗'}
                  </span>
                  <span>{copiedShare ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              <div className={styles.modalCardWrap}>
                <Card userCard={selectedCard} tilt />
              </div>

              <div className={styles.modalExtract}>
                <div className={styles.modalExtractScroll}>
                  <p className={styles.modalExtractText}>
                    {selectedCard.card.wikiExtract || 'No description available.'}
                  </p>
                </div>
                <div className={styles.modalExtractFade} aria-hidden="true" />
              </div>
            </div>

            {(() => {
              const tags = modalQidTags(selectedCard.card.qidChain ?? []);
              return tags.length > 0 ? (
                <div className={styles.modalTags}>
                  {tags.map(n => (
                    <span key={n.qid} className={styles.modalTag} title={`${n.qid} · depth ${n.depth}`}>
                      {n.label}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Collection</h1>
        <div className={styles.packControls}>
          {storedPacks < 1 && secondsUntilNext > 0 && (
            <span className={styles.packTimer}>
              Next pack in <span className={styles.countdown}>{mm}:{ss}</span>
            </span>
          )}
          <button
            className={styles.openPackBtn}
            onClick={handleOpenPack}
            disabled={storedPacks < 1}
          >
            {`Open Pack (${storedPacks})`}
          </button>
        </div>
      </div>

      {/* ── Pity Tracker ── */}
      <section className={styles.pitySection} aria-label="Pity pack tracker">
        <h2 className={styles.pitySectionTitle}>Pity Packs</h2>
        <div className={styles.pityRows}>

          <div className={styles.pityRow}>
            <div className={styles.pityLabel}>
              <span className={styles.pityLabelTitle}>
                SR / SSR
                {pitySrAvailable > 0 && (
                  <span className={`${styles.pityBadge} ${styles.pityBadgeSr}`}>
                    {pitySrAvailable}
                  </span>
                )}
              </span>
              <span className={styles.pityLabelSub}>
                Every {PITY_SR_THRESHOLD} packs · 50/50 SR or SSR
              </span>
            </div>
            <div className={styles.pityBarWrap}>
              <div className={styles.pityBarTrack}>
                <div className={`${styles.pityBarFill} ${styles.pityBarFillSr}`} style={{ width: `${srPct}%` }} />
              </div>
              <span className={styles.pityBarLabel}>{pitySrProgress} / {PITY_SR_THRESHOLD} packs</span>
            </div>
            <button
              className={`${styles.pityOpenBtn} ${styles.pityOpenBtnSr}`}
              disabled={pitySrAvailable < 1 || openPityPack.isPending}
              onClick={() => handleOpenPityPack('SR')}
            >
              {pitySrAvailable > 0 ? `Open (${pitySrAvailable})` : 'Not yet'}
            </button>
          </div>

          <div className={styles.pityRow}>
            <div className={styles.pityLabel}>
              <span className={styles.pityLabelTitle}>
                UR / MR
                {pityUrAvailable > 0 && (
                  <span className={`${styles.pityBadge} ${styles.pityBadgeUr}`}>
                    {pityUrAvailable}
                  </span>
                )}
              </span>
              <span className={styles.pityLabelSub}>
                Every {PITY_UR_THRESHOLD} packs · 50/50 UR or MR
              </span>
            </div>
            <div className={styles.pityBarWrap}>
              <div className={styles.pityBarTrack}>
                <div className={`${styles.pityBarFill} ${styles.pityBarFillUr}`} style={{ width: `${urPct}%` }} />
              </div>
              <span className={styles.pityBarLabel}>{pityUrProgress} / {PITY_UR_THRESHOLD} packs</span>
            </div>
            <button
              className={`${styles.pityOpenBtn} ${styles.pityOpenBtnUr}`}
              disabled={pityUrAvailable < 1 || openPityPack.isPending}
              onClick={() => handleOpenPityPack('UR')}
            >
              {pityUrAvailable > 0 ? `Open (${pityUrAvailable})` : 'Not yet'}
            </button>
          </div>

        </div>
      </section>

      {/* ── Search / Filter / Sort Controls ── */}
      {!isLoading && (collection?.data.length ?? 0) > 0 && (
        <div className={styles.controls}>
          {/* Row 1: search + traits dropdown + sort */}
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search by name, description, or trait…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search cards"
            />

            <div className={styles.traitDropdown}>
              <button
                ref={traitBtnRef}
                className={[styles.traitToggleBtn, selectedTraits.size > 0 ? styles.traitToggleBtnActive : ''].filter(Boolean).join(' ')}
                onClick={() => setTraitOpen(o => !o)}
                aria-expanded={traitOpen}
              >
                Traits{selectedTraits.size > 0 ? ` (${selectedTraits.size})` : ''}
                <span className={styles.traitToggleArrow}>{traitOpen ? '▲' : '▼'}</span>
              </button>
              {traitOpen && (
                <div className={styles.traitPopover} ref={traitPopoverRef}>
                  <input
                    className={styles.traitSearch}
                    type="search"
                    placeholder="Filter traits…"
                    value={traitSearch}
                    onChange={e => setTraitSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.traitList}>
                    {visibleTraits.length === 0 ? (
                      <span className={styles.traitEmpty}>No traits found</span>
                    ) : visibleTraits.map(trait => (
                      <label key={trait} className={[styles.traitItem, selectedTraits.has(trait) ? styles.traitItemActive : ''].filter(Boolean).join(' ')}>
                        <input
                          type="checkbox"
                          checked={selectedTraits.has(trait)}
                          onChange={() => toggleTrait(trait)}
                          className={styles.traitCheckbox}
                        />
                        {trait}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sortControl}>
              <select
                className={styles.sortSelect}
                value={sortField}
                onChange={e => setSortField(e.target.value as SortField)}
                aria-label="Sort by"
              >
                <option value="total">Total Power</option>
                <option value="atk">ATK</option>
                <option value="hp">HP</option>
                <option value="spd">SPD</option>
                <option value="rarity">Rarity</option>
                <option value="name">Name</option>
                <option value="acquired">Date Acquired</option>
              </select>
              <button
                className={styles.sortDirBtn}
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                aria-label={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
                title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
              >
                {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>

          {/* Row 2: rarity chips + foil + reset */}
          <div className={styles.filterRow}>
            {ALL_RARITIES.map(r => (
              <button
                key={r}
                className={[
                  styles.rarityChip,
                  enabledRarities.has(r) && enabledRarities.size < ALL_RARITIES.length
                    ? (styles[`rarityChipActive-${r}`] ?? styles.rarityChipActiveDefault)
                    : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleRarity(r)}
                aria-pressed={enabledRarities.size < ALL_RARITIES.length && enabledRarities.has(r)}
              >
                {r}
              </button>
            ))}

            <button
              className={[styles.foilToggle, foilOnly ? styles.foilActive : ''].filter(Boolean).join(' ')}
              onClick={() => setFoilOnly(o => !o)}
              aria-pressed={foilOnly}
            >
              ✦ Foil
            </button>

            {hasActiveFilters && (
              <button className={styles.resetBtn} onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>

          {/* Active trait chips */}
          {selectedTraits.size > 0 && (
            <div className={styles.activeTraits}>
              {[...selectedTraits].map(trait => (
                <button
                  key={trait}
                  className={styles.traitChip}
                  onClick={() => toggleTrait(trait)}
                  title="Remove filter"
                >
                  {trait} ✕
                </button>
              ))}
            </div>
          )}

          <span className={styles.resultCount}>
            {filteredCollection.length === collection?.data.length
              ? `${filteredCollection.length} cards`
              : `${filteredCollection.length} of ${collection?.data.length} cards`}
          </span>
        </div>
      )}

      {/* ── Collection grid ── */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : (collection?.data.length ?? 0) === 0 ? (
        <div className={styles.empty}>
          <p>Your collection is empty.</p>
          <p>Open a pack to get your first cards!</p>
        </div>
      ) : filteredCollection.length === 0 ? (
        <div className={styles.empty}>
          <p>No cards match your filters.</p>
          <button className={styles.resetBtnInline} onClick={resetFilters}>Clear filters</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCollection.map((uc) => (
            <Card
              key={uc.id}
              userCard={uc}
              onClick={() => setSelectedCard(uc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
