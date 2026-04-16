import React, { useMemo, useState } from 'react';
import {
  RARITY_DISPLAY,
  calculateCP,
  evaluateTeam,
} from '@wikibattler/shared';
import type {
  UserCard,
  Rarity,
  BattleMode,
  DynamicSynergy,
} from '@wikibattler/shared';
import { useCollection } from '../../api/useCards.js';
import styles from './TeamBuilder.module.css';

interface TeamBuilderProps {
  onBattle: (cardIds: string[], mode: BattleMode) => void;
  isBattling: boolean;
}

// Synergy bonus tier labels based on multiplier magnitude
function synergyTier(mult: number): { icon: string; color: string } {
  if (mult >= 1.35) return { icon: '🥇', color: 'var(--rarity-ur)' };
  if (mult >= 1.20) return { icon: '🥈', color: 'var(--rarity-r)' };
  return                    { icon: '🥉', color: 'var(--rarity-sr)' };
}

const MODES: { mode: BattleMode; label: string; desc: string }[] = [
  { mode: 'TRAINING', label: 'Training', desc: 'vs. bot · no coins' },
  { mode: 'CASUAL',   label: 'Casual',   desc: 'vs. ghost · 10–50 coins' },
  { mode: 'RANKED',   label: 'Ranked',   desc: 'vs. ghost · ±rating' },
];

export function TeamBuilder({ onBattle, isBattling }: TeamBuilderProps) {
  const { data: collection, isLoading } = useCollection();
  const [slots, setSlots] = useState<(UserCard | null)[]>([null, null, null, null, null]);
  const [mode, setMode] = useState<BattleMode>('TRAINING');
  const [search, setSearch] = useState('');

  const cards = collection?.data ?? [];
  const teamIds = new Set(slots.filter(Boolean).map((uc) => uc!.id));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cards.filter(
      (uc) =>
        !teamIds.has(uc.id) &&
        (q === '' ||
          uc.card.wikiTitle.toLowerCase().includes(q) ||
          uc.card.rarity.toLowerCase().includes(q) ||
          (uc.card.qidChain ?? []).some((n) => n.label.toLowerCase().includes(q)))
    );
  }, [cards, teamIds, search]);

  const teamCards = slots.filter(Boolean).map((uc) => ({
    qidChain: uc!.card.qidChain ?? [],
    attack:   uc!.card.attack,
    health:   uc!.card.health,
    speed:    uc!.card.speed,
  }));

  const synergyResult = useMemo(() => evaluateTeam(teamCards), [JSON.stringify(teamCards)]);
  const cp = useMemo(() => calculateCP(teamCards, synergyResult), [teamCards, synergyResult]);

  function addCard(uc: UserCard) {
    const idx = slots.findIndex((s) => s === null);
    if (idx === -1) return;
    const next = [...slots];
    next[idx] = uc;
    setSlots(next);
  }

  function removeCard(idx: number) {
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
  }

  const teamFull = slots.every(Boolean);
  const teamCount = slots.filter(Boolean).length;

  function handleBattle() {
    const ids = slots.filter(Boolean).map((uc) => uc!.id);
    onBattle(ids, mode);
  }

  return (
    <div className={styles.root}>
      {/* ── Team Slots ── */}
      <section className={styles.teamSection}>
        <div className={styles.teamHeader}>
          <h2 className={styles.teamTitle}>Your Team</h2>
          <span className={styles.cpBadge}>
            CP <strong>{cp.toLocaleString()}</strong>
          </span>
        </div>

        <div className={styles.slots}>
          {slots.map((uc, i) => (
            <div
              key={i}
              className={[styles.slot, uc ? styles.slotFilled : styles.slotEmpty].join(' ')}
              onClick={() => uc && removeCard(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && uc && removeCard(i)}
              aria-label={uc ? `Remove ${uc.card.wikiTitle}` : `Empty slot ${i + 1}`}
            >
              {uc ? (
                <>
                  {uc.card.wikiThumbUrl ? (
                    <img className={styles.slotImg} src={uc.card.wikiThumbUrl} alt={uc.card.wikiTitle} />
                  ) : (
                    <div className={styles.slotImgFallback}>{uc.card.wikiTitle.slice(0, 2)}</div>
                  )}
                  <span className={styles.slotRarity} style={{ color: `var(--rarity-${uc.card.rarity.toLowerCase()})` }}>
                    {uc.card.rarity}
                  </span>
                  <span className={styles.slotName}>{uc.card.wikiTitle}</span>
                  <button className={styles.removeBtn} aria-label="Remove" tabIndex={-1}>✕</button>
                </>
              ) : (
                <span className={styles.slotPlus}>+</span>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic synergy badges */}
        {synergyResult.synergies.length > 0 && (
          <div className={styles.synergies}>
            {synergyResult.synergies.map((syn: DynamicSynergy) => {
              const { icon, color } = synergyTier(syn.statMultiplier);
              const pct = Math.round((syn.statMultiplier - 1) * 100);
              return (
                <div
                  key={syn.qid}
                  className={styles.synergyBadge}
                  style={{ borderColor: color }}
                  title={`${syn.sharedCount}/${syn.teamSize} cards · +${pct}% all stats`}
                >
                  <span className={styles.synergyTier}>{icon}</span>
                  <span className={styles.synergyName}>{syn.label}</span>
                  <span className={styles.synergyBonus} style={{ color }}>+{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Mode + Battle button ── */}
      <section className={styles.modeSection}>
        <div className={styles.modeTabs}>
          {MODES.map((m) => (
            <button
              key={m.mode}
              className={[styles.modeTab, mode === m.mode ? styles.modeTabActive : ''].join(' ')}
              onClick={() => setMode(m.mode)}
            >
              <span className={styles.modeTabLabel}>{m.label}</span>
              <span className={styles.modeTabDesc}>{m.desc}</span>
            </button>
          ))}
        </div>
        <button
          className={styles.battleBtn}
          disabled={!teamFull || isBattling}
          onClick={handleBattle}
        >
          {isBattling
            ? 'Resolving…'
            : teamFull
            ? '⚔ Battle!'
            : `Select ${5 - teamCount} more card${5 - teamCount !== 1 ? 's' : ''}`}
        </button>
      </section>

      {/* ── Collection picker ── */}
      <section className={styles.pickerSection}>
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Collection</h3>
          <input
            className={styles.search}
            type="text"
            placeholder="Search by name, rarity, or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search cards"
          />
        </div>

        {isLoading ? (
          <div className={styles.pickerGrid}>
            {Array.from({ length: 10 }, (_, i) => <div key={i} className={styles.pickerSkeleton} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.pickerEmpty}>
            {cards.length === 0 ? 'No cards yet — open a pack first!' : 'No cards match your search.'}
          </p>
        ) : (
          <div className={styles.pickerGrid}>
            {filtered.map((uc) => {
              const info = RARITY_DISPLAY[uc.card.rarity as Rarity];
              return (
                <button
                  key={uc.id}
                  className={[
                    styles.pickerCard,
                    !teamFull ? styles.pickerCardAvailable : styles.pickerCardFull,
                  ].join(' ')}
                  onClick={() => !teamFull && addCard(uc)}
                  disabled={teamFull}
                  title={uc.card.wikiTitle}
                >
                  <div className={styles.pickerCardInner} style={{ borderColor: info.color }}>
                    {uc.card.wikiThumbUrl ? (
                      <img className={styles.pickerImg} src={uc.card.wikiThumbUrl} alt={uc.card.wikiTitle} loading="lazy" />
                    ) : (
                      <div className={styles.pickerImgFallback}>{uc.card.wikiTitle.slice(0, 3)}</div>
                    )}
                    <div className={styles.pickerInfo}>
                      <span className={styles.pickerName}>{uc.card.wikiTitle}</span>
                      <span className={styles.pickerRarity} style={{ color: info.color }}>
                        {uc.card.rarity}{uc.isFoil ? ' ✦' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
