import React, { useMemo, useState } from 'react';
import {
  SYNERGY_RULES,
  RARITY_ORDER,
  RARITY_DISPLAY,
  calculateCP,
} from '@wikibattler/shared';
import type {
  UserCard,
  Rarity,
  BattleMode,
  SynergyMatch,
  TeamSynergyResult,
  SynergyCondition,
} from '@wikibattler/shared';
import { useCollection } from '../../api/useCards.js';
import styles from './TeamBuilder.module.css';

interface TeamBuilderProps {
  onBattle: (cardIds: string[], mode: BattleMode) => void;
  isBattling: boolean;
}

// ─── Client-side synergy evaluation ──────────────────────────────────────────

function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

function meetsCondition(
  cond: SynergyCondition,
  cards: { rarity: Rarity; tags: string[] }[]
): boolean {
  switch (cond.type) {
    case 'has_tag':
      return cards.filter((c) => c.tags.includes(cond.tag)).length >= cond.minCount;
    case 'has_rarity': {
      const minRank = rarityRank(cond.rarity);
      return cards.filter((c) => rarityRank(c.rarity) >= minRank).length >= cond.minCount;
    }
    case 'team_size':
      return cards.length === cond.exact;
    case 'all_same_tag':
      return cards.length > 0 && cards.every((c) => c.tags.includes(cond.tag));
    default:
      return false;
  }
}

function evaluateTeam(cards: { rarity: Rarity; tags: string[]; attack: number; health: number; speed: number }[]): TeamSynergyResult {
  const matched: SynergyMatch[] = [];
  for (const rule of SYNERGY_RULES) {
    const mode = rule.conditionMode ?? 'all';
    const passes =
      mode === 'all'
        ? rule.conditions.every((c) => meetsCondition(c, cards))
        : rule.conditions.some((c) => meetsCondition(c, cards));
    if (passes) matched.push({ rule, activationCount: 1 });
  }

  let cpMultiplier = 1;
  const atkMult: number[] = [1];
  const hpMult: number[] = [1];
  const spdMult: number[] = [1];
  const bonusEffects: TeamSynergyResult['bonusEffects'] = [];

  for (const { rule } of matched) {
    for (const eff of rule.effects) {
      switch (eff.type) {
        case 'cp_multiply':
          cpMultiplier *= eff.multiplier;
          break;
        case 'stat_multiply':
          if (eff.stat === 'all' || eff.stat === 'attack') atkMult.push(eff.multiplier);
          if (eff.stat === 'all' || eff.stat === 'health') hpMult.push(eff.multiplier);
          if (eff.stat === 'all' || eff.stat === 'speed') spdMult.push(eff.multiplier);
          break;
        default:
          bonusEffects.push(eff);
      }
    }
  }

  return {
    matched,
    cpMultiplier,
    statMultipliers: {
      attack: atkMult.reduce((a, b) => a * b, 1),
      health: hpMult.reduce((a, b) => a * b, 1),
      speed: spdMult.reduce((a, b) => a * b, 1),
    },
    bonusEffects,
  };
}

const TIER_LABEL: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const TIER_COLOR: Record<string, string> = {
  bronze: 'var(--rarity-sr)',
  silver: 'var(--rarity-r)',
  gold: 'var(--rarity-ur)',
};

const MODES: { mode: BattleMode; label: string; desc: string }[] = [
  { mode: 'TRAINING', label: 'Training', desc: 'vs. bot · no coins' },
  { mode: 'CASUAL',   label: 'Casual',   desc: 'vs. ghost · 10–50 coins' },
  { mode: 'RANKED',   label: 'Ranked',   desc: 'vs. ghost · ±rating' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamBuilder({ onBattle, isBattling }: TeamBuilderProps) {
  const { data: collection, isLoading } = useCollection();
  const [slots, setSlots] = useState<(UserCard | null)[]>([null, null, null, null, null]);
  const [mode, setMode] = useState<BattleMode>('TRAINING');
  const [search, setSearch] = useState('');

  const cards = collection?.data ?? [];

  // IDs already in team
  const teamIds = new Set(slots.filter(Boolean).map((uc) => uc!.id));

  // Filtered collection
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cards.filter(
      (uc) =>
        !teamIds.has(uc.id) &&
        (q === '' ||
          uc.card.wikiTitle.toLowerCase().includes(q) ||
          uc.card.rarity.toLowerCase().includes(q) ||
          uc.card.tags.some((t) => t.includes(q)))
    );
  }, [cards, teamIds, search]);

  // Synergy + CP
  const teamCards = slots.filter(Boolean).map((uc) => ({
    rarity: uc!.card.rarity as Rarity,
    tags: uc!.card.tags,
    attack: uc!.card.attack,
    health: uc!.card.health,
    speed: uc!.card.speed,
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
                    <img
                      className={styles.slotImg}
                      src={uc.card.wikiThumbUrl}
                      alt={uc.card.wikiTitle}
                    />
                  ) : (
                    <div className={styles.slotImgFallback}>{uc.card.wikiTitle.slice(0, 2)}</div>
                  )}
                  <span
                    className={styles.slotRarity}
                    style={{ color: `var(--rarity-${uc.card.rarity.toLowerCase()})` }}
                  >
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

        {/* Synergy badges */}
        {synergyResult.matched.length > 0 && (
          <div className={styles.synergies}>
            {synergyResult.matched.map(({ rule }) => (
              <div
                key={rule.id}
                className={styles.synergyBadge}
                style={{ borderColor: TIER_COLOR[rule.tier] }}
                title={rule.description}
              >
                <span className={styles.synergyTier}>{TIER_LABEL[rule.tier]}</span>
                <span className={styles.synergyName}>{rule.name}</span>
              </div>
            ))}
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
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search cards"
          />
        </div>

        {isLoading ? (
          <div className={styles.pickerGrid}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={styles.pickerSkeleton} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.pickerEmpty}>
            {cards.length === 0
              ? 'No cards yet — open a pack first!'
              : 'No cards match your search.'}
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
                  <div
                    className={styles.pickerCardInner}
                    style={{ borderColor: info.color }}
                  >
                    {uc.card.wikiThumbUrl ? (
                      <img
                        className={styles.pickerImg}
                        src={uc.card.wikiThumbUrl}
                        alt={uc.card.wikiTitle}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.pickerImgFallback}>
                        {uc.card.wikiTitle.slice(0, 3)}
                      </div>
                    )}
                    <div className={styles.pickerInfo}>
                      <span className={styles.pickerName}>{uc.card.wikiTitle}</span>
                      <span
                        className={styles.pickerRarity}
                        style={{ color: info.color }}
                      >
                        {uc.card.rarity}
                        {uc.isFoil ? ' ✦' : ''}
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
