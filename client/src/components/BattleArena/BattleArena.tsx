import React, { useEffect, useRef, useState } from 'react';
import type { CombatLog, CombatTick } from '@wikibattler/shared';
import styles from './BattleArena.module.css';

interface BattleArenaProps {
  combatLog: CombatLog;
  cpAttacker: number;
  cpDefender: number;
  coinsEarned: number;
  ratingDelta: number | null;
  onPlayAgain: () => void;
}

const TICK_INTERVAL_MS = 120;

export function BattleArena({
  combatLog,
  cpAttacker,
  cpDefender,
  coinsEarned,
  ratingDelta,
  onPlayAgain,
}: BattleArenaProps) {
  const { ticks, winner, totalTicks } = combatLog;

  const maxHpAtk = ticks[0]?.attackerHp ?? 1;
  const maxHpDef = ticks[0]?.defenderHp ?? 1;

  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const currentTick: CombatTick | undefined = ticks[cursor];
  const atkHp = currentTick?.attackerHp ?? 0;
  const defHp = currentTick?.defenderHp ?? 0;
  const atkPct = Math.max(0, (atkHp / maxHpAtk) * 100);
  const defPct = Math.max(0, (defHp / maxHpDef) * 100);

  const done = cursor >= totalTicks - 1;

  // Collect all events up to current tick for the log
  const recentEvents = ticks
    .slice(Math.max(0, cursor - 14), cursor + 1)
    .flatMap((t, i) =>
      t.events.map((ev, j) => ({ ...ev, tick: t.tick, key: `${t.tick}-${i}-${j}` }))
    )
    .reverse();

  // Auto-advance
  useEffect(() => {
    if (!playing || done) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCursor((c) => {
        if (c >= totalTicks - 1) { setPlaying(false); return c; }
        return c + 1;
      });
    }, TICK_INTERVAL_MS / speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, done, totalTicks]);

  // Scroll event log to top when cursor changes
  useEffect(() => {
    logRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cursor]);

  function handleReplay() {
    setCursor(0);
    setPlaying(true);
  }

  const atkColor = winner === 'attacker' ? '#8b72ff' : winner === 'draw' ? '#9ca3af' : '#f87171';
  const defColor = winner === 'defender' ? '#f87171' : winner === 'draw' ? '#9ca3af' : '#6b7280';

  return (
    <div className={styles.root}>
      {/* ── Result banner ── */}
      {done && (
        <div
          className={[
            styles.resultBanner,
            winner === 'attacker' ? styles.bannerWin :
            winner === 'defender' ? styles.bannerLoss :
            styles.bannerDraw,
          ].join(' ')}
        >
          <span className={styles.resultIcon}>
            {winner === 'attacker' ? '🏆' : winner === 'defender' ? '💀' : '🤝'}
          </span>
          <span className={styles.resultText}>
            {winner === 'attacker' ? 'Victory!' : winner === 'defender' ? 'Defeated' : 'Draw'}
          </span>
          {coinsEarned > 0 && (
            <span className={styles.resultCoins}>+{coinsEarned} coins</span>
          )}
          {ratingDelta !== null && (
            <span className={[styles.resultRating, ratingDelta >= 0 ? styles.ratingPos : styles.ratingNeg].join(' ')}>
              {ratingDelta >= 0 ? '+' : ''}{ratingDelta} rating
            </span>
          )}
        </div>
      )}

      {/* ── HP bars ── */}
      <div className={styles.hpSection}>
        {/* Attacker */}
        <div className={styles.side}>
          <div className={styles.sideHeader}>
            <span className={styles.sideName} style={{ color: atkColor }}>You</span>
            <span className={styles.sideCP}>CP {cpAttacker.toLocaleString()}</span>
          </div>
          <div className={styles.hpBarTrack}>
            <div
              className={styles.hpBarFill}
              style={{
                width: `${atkPct}%`,
                background: atkPct > 50
                  ? 'linear-gradient(90deg, #6d28d9, #8b72ff)'
                  : atkPct > 20
                  ? 'linear-gradient(90deg, #fb923c, #fbbf24)'
                  : 'linear-gradient(90deg, #dc2626, #f87171)',
              }}
            />
          </div>
          <span className={styles.hpValue}>{atkHp.toLocaleString()}</span>
        </div>

        {/* Tick counter */}
        <div className={styles.vsColumn}>
          <span className={styles.vsText}>VS</span>
          <span className={styles.tickLabel}>Tick {(currentTick?.tick ?? 0)}</span>
        </div>

        {/* Defender */}
        <div className={[styles.side, styles.sideRight].join(' ')}>
          <div className={[styles.sideHeader, styles.sideHeaderRight].join(' ')}>
            <span className={styles.sideCP}>CP {cpDefender.toLocaleString()}</span>
            <span className={styles.sideName} style={{ color: defColor }}>Opponent</span>
          </div>
          <div className={styles.hpBarTrack}>
            <div
              className={[styles.hpBarFill, styles.hpBarRight].join(' ')}
              style={{
                width: `${defPct}%`,
                background: defPct > 50
                  ? 'linear-gradient(270deg, #b91c1c, #f87171)'
                  : defPct > 20
                  ? 'linear-gradient(270deg, #fb923c, #fbbf24)'
                  : 'linear-gradient(270deg, #dc2626, #f87171)',
              }}
            />
          </div>
          <span className={[styles.hpValue, styles.hpValueRight].join(' ')}>{defHp.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Scrubber ── */}
      <div className={styles.scrubberRow}>
        <input
          type="range"
          className={styles.scrubber}
          min={0}
          max={totalTicks - 1}
          value={cursor}
          onChange={(e) => {
            setCursor(Number(e.target.value));
            setPlaying(false);
          }}
          aria-label="Battle timeline"
        />
      </div>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        <button
          className={styles.controlBtn}
          onClick={() => { setCursor(0); setPlaying(false); }}
          title="Restart"
        >⏮</button>

        <button
          className={[styles.controlBtn, styles.playPauseBtn].join(' ')}
          onClick={() => done ? handleReplay() : setPlaying((p) => !p)}
        >
          {done ? '↺' : playing ? '⏸' : '▶'}
        </button>

        <button
          className={styles.controlBtn}
          onClick={() => { setCursor(totalTicks - 1); setPlaying(false); }}
          title="Skip to end"
        >⏭</button>

        <div className={styles.speedGroup}>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              className={[styles.speedBtn, speed === s ? styles.speedActive : ''].join(' ')}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── Event log ── */}
      <div className={styles.logSection} ref={logRef}>
        {recentEvents.length === 0 ? (
          <p className={styles.logEmpty}>Battle beginning…</p>
        ) : (
          recentEvents.map((ev) => (
            <div key={ev.key} className={[styles.logEntry, styles[`log-${ev.type}`]].join(' ')}>
              <span className={styles.logTick}>T{ev.tick}</span>
              <span className={styles.logSource}>
                {ev.source === 'attacker' ? 'You' : 'Opp'}
              </span>
              <span className={styles.logDesc}>{describeEvent(ev)}</span>
            </div>
          ))
        )}
      </div>

      {/* ── Play again ── */}
      <button className={styles.playAgainBtn} onClick={onPlayAgain}>
        ← Build New Team
      </button>
    </div>
  );
}

function describeEvent(ev: { type: string; [k: string]: unknown }): string {
  switch (ev.type) {
    case 'damage': return `dealt ${(ev.amount as number).toLocaleString()} dmg`;
    case 'crit':   return `CRIT! ${(ev.amount as number).toLocaleString()} dmg`;
    case 'regen':  return `healed ${(ev.amount as number).toLocaleString()} HP`;
    case 'shield': return `shielded ${(ev.amount as number).toLocaleString()} HP`;
    case 'execute': return 'executed enemy!';
    default:       return ev.type;
  }
}
