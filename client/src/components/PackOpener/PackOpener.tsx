import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { Card } from '../Card/Card.js';
import styles from './PackOpener.module.css';

type Phase = 'charging' | 'ready-fanfare' | 'sealed' | 'shaking' | 'bursting' | 'revealing' | 'done';

const FLASH_RARITIES = new Set(['SR', 'SSR', 'UR', 'MR']);
const RARITY_ORDER = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR'];
const FLASH_COLORS: Record<string, string> = {
  SR:  'rgba(251,146,60,0.22)',
  SSR: 'rgba(248,113,113,0.28)',
  UR:  'rgba(251,191,36,0.32)',
  MR:  'rgba(192,132,252,0.35)',
};
const PARTICLE_COUNTS: Record<string, number> = { SR: 0, SSR: 6, UR: 12, MR: 20 };

// Deterministic charge particles (stable across renders)
const CHARGE_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  angle: (360 / 28) * i,
  dist: 140 + (i % 3) * 30,
  size: 3 + (i % 4),
  color: (['#c084fc', '#a855f7', '#6366f1', '#60a5fa', '#c8a84b', '#ec4899', '#818cf8'] as const)[i % 7],
  dur: 1.4 + (i % 5) * 0.2,
  delay: -((i / 28) * 1.4),
}));

interface FloatParticle { id: number; dx: number; color: string; size: number; }

interface PackOpenerProps {
  cards: UserCard[];     // empty while charging, populated when ready
  isCharging: boolean;   // controlled by parent
  onClose: () => void;
}

export function PackOpener({ cards, isCharging, onClose }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>(isCharging ? 'charging' : 'sealed');
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [floatParticles, setFloatParticles] = useState<FloatParticle[]>([]);
  const [showReadyBurst, setShowReadyBurst] = useState(false);
  const [peakRarity, setPeakRarity] = useState<string | null>(null);
  const particleId = useRef(0);
  // Separate timers: phaseTimer is cleaned up on phase change; chargeTimer is not
  const phaseTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardsRef = useRef(cards);

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  useEffect(() => {
    return () => {
      revealTimersRef.current.forEach(clearTimeout);
      if (phaseTimerRef.current)  clearTimeout(phaseTimerRef.current);
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      if (ambientRef.current)     clearInterval(ambientRef.current);
    };
  }, []);

  const spawnFloatParticles = useCallback((rarity: string) => {
    const count = PARTICLE_COUNTS[rarity] ?? 0;
    if (count === 0) return;
    const colors = {
      SSR: ['#f87171', '#fb923c', '#fbbf24'],
      UR:  ['#fbbf24', '#f0c860', '#fde68a'],
      MR:  ['#c084fc', '#ec4899', '#6366f1', '#a855f7'],
    }[rarity] ?? ['#fff'];
    const newParticles: FloatParticle[] = Array.from({ length: count }, () => ({
      id: ++particleId.current,
      dx: (Math.random() - 0.5) * 80,
      color: colors[Math.floor(Math.random() * colors.length)] ?? '#fff',
      size: 4 + Math.random() * 6,
    }));
    setFloatParticles(p => [...p, ...newParticles]);
    setTimeout(() => {
      setFloatParticles(p => p.filter(x => !newParticles.some(n => n.id === x.id)));
    }, 1200);
  }, []);

  // Loop ambient particles while SR+ cards are visible
  useEffect(() => {
    const showCards = phase === 'revealing' || phase === 'done';
    if (showCards && peakRarity && FLASH_RARITIES.has(peakRarity)) {
      ambientRef.current = setInterval(() => spawnFloatParticles(peakRarity), 1400);
    }
    return () => { if (ambientRef.current) { clearInterval(ambientRef.current); ambientRef.current = null; } };
  }, [phase, peakRarity, spawnFloatParticles]);

  // When parent signals charging is done → play ready fanfare then unlock
  useEffect(() => {
    if (!isCharging && phase === 'charging') {
      setPhase('ready-fanfare');
      setShowReadyBurst(true);
      // Use a dedicated timer so the phase-effect cleanup can't cancel this
      chargeTimerRef.current = setTimeout(() => {
        setShowReadyBurst(false);
        setPhase('sealed');
      }, 900);
    }
  }, [isCharging]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance shake → burst → reveal
  useEffect(() => {
    if (phase === 'shaking') {
      phaseTimerRef.current = setTimeout(() => setPhase('bursting'), 800);
    } else if (phase === 'bursting') {
      phaseTimerRef.current = setTimeout(() => {
        setPhase('revealing');
        startReveal();
      }, 500);
    }
    return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function triggerFlash(rarity: string) {
    const color = FLASH_COLORS[rarity];
    if (!color) return;
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 700);
  }

  function startReveal() {
    revealTimersRef.current.forEach(clearTimeout);
    const current = cardsRef.current;
    revealTimersRef.current = current.map((uc, i) =>
      setTimeout(() => {
        setRevealed(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        const rarity = uc.card.rarity;
        if (FLASH_RARITIES.has(rarity)) {
          triggerFlash(rarity);
          spawnFloatParticles(rarity);
          setPeakRarity(prev => {
            const prevIdx = RARITY_ORDER.indexOf(prev ?? '');
            return RARITY_ORDER.indexOf(rarity) > prevIdx ? rarity : prev;
          });
        }
        if (i === current.length - 1) {
          const t = setTimeout(() => setPhase('done'), 400);
          revealTimersRef.current.push(t);
        }
      }, i * 260)
    );
  }

  function handleSkip() {
    if (phaseTimerRef.current)  clearTimeout(phaseTimerRef.current);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];
    setFlashColor(null);
    setFloatParticles([]);
    setShowReadyBurst(false);
    setPhase('done');
    setRevealed(cardsRef.current.map(() => true));
    // Compute peak from all cards so the ambient still shows after skip
    const peak = cardsRef.current.reduce<string | null>((best, uc) => {
      const idx = RARITY_ORDER.indexOf(uc.card.rarity);
      return idx > RARITY_ORDER.indexOf(best ?? '') ? uc.card.rarity : best;
    }, null);
    if (peak && FLASH_RARITIES.has(peak)) setPeakRarity(peak);
  }

  function handlePackClick() {
    if (phase !== 'sealed') return;
    setRevealed(cardsRef.current.map(() => false));
    setPhase('shaking');
  }

  const isChargingPhase = phase === 'charging' || phase === 'ready-fanfare';
  const showPack  = isChargingPhase || phase === 'sealed' || phase === 'shaking' || phase === 'bursting';
  const showCards = phase === 'revealing' || phase === 'done';

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog">
      {/* Looping ambient glow when SR+ cards are visible */}
      {showCards && peakRarity && FLASH_RARITIES.has(peakRarity) && (
        <div
          className={styles.ambientGlow}
          style={{ background: `radial-gradient(ellipse at center, ${FLASH_COLORS[peakRarity]} 0%, transparent 65%)` }}
        />
      )}

      {flashColor && (
        <div
          className={styles.rarityFlash}
          style={{ background: `radial-gradient(ellipse at center, ${flashColor} 0%, transparent 70%)` }}
        />
      )}

      <div className={styles.particleLayer} aria-hidden="true">
        {floatParticles.map(p => (
          <div
            key={p.id}
            className={styles.floatParticle}
            style={{ '--dx': `${p.dx}px`, background: p.color, width: p.size, height: p.size } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={styles.modal}>
        {(phase === 'revealing' || phase === 'done') && (
          <button className={styles.skipBtn} onClick={handleSkip}>Skip</button>
        )}

        {showPack && (
          <div className={styles.packScene}>
            {/* Particle ring — centered on the pack */}
            <div className={styles.packMain}>
              {phase === 'charging' && (
                <div className={styles.chargeRing} aria-hidden="true">
                  {CHARGE_PARTICLES.map(p => (
                    <div
                      key={p.id}
                      className={styles.chargeParticle}
                      style={{
                        '--angle': `${p.angle}deg`,
                        '--dist':  `${p.dist}px`,
                        '--dur':   `${p.dur}s`,
                        '--cdelay': `${p.delay}s`,
                        width:  p.size,
                        height: p.size,
                        background: p.color,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}

              {showReadyBurst && (
                <div className={styles.readyBurstRing} aria-hidden="true">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className={styles.readyBurstParticle}
                      style={{ '--angle': `${i * 15}deg` } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}

              <div
                className={[
                  styles.packWrap,
                  isChargingPhase          ? styles.packCharging   : '',
                  phase === 'ready-fanfare'? styles.packReadyFlash : '',
                  phase === 'shaking'      ? styles.shaking        : '',
                  phase === 'bursting'     ? styles.bursting       : '',
                ].filter(Boolean).join(' ')}
                onClick={handlePackClick}
                role="button"
                tabIndex={phase === 'sealed' ? 0 : -1}
                aria-label={phase === 'sealed' ? 'Open pack' : undefined}
                aria-disabled={phase !== 'sealed'}
                onKeyDown={(e) => e.key === 'Enter' && handlePackClick()}
              >
                <div className={styles.pack}>
                  <div className={styles.packGlow} />
                  <div className={styles.packCornerTL} />
                  <div className={styles.packCornerBR} />
                  <div className={styles.packBody}>
                    <span className={[styles.packIcon, isChargingPhase ? styles.packIconCharge : ''].filter(Boolean).join(' ')}>
                      {phase === 'ready-fanfare' ? '✦' : isChargingPhase ? '◈' : '✦'}
                    </span>
                    <span className={styles.packLabel}>WikiBattler</span>
                    <span className={styles.packSub}>Booster Pack</span>
                  </div>
                  <div className={styles.packShine} />
                </div>
              </div>
            </div>

            {phase === 'charging' && (
              <p className={styles.chargingText}>Loading booster pack...</p>
            )}
            {phase === 'ready-fanfare' && (
              <p className={styles.readyText}>✦ Pack ready!</p>
            )}
            {phase === 'sealed' && (
              <p className={styles.packHint}>Click to open!</p>
            )}
          </div>
        )}

        {phase === 'bursting' && (
          <div className={styles.burstParticles}>
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className={styles.particle}
                style={{ '--angle': `${i * 22.5}deg` } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {showCards && (
          <div className={styles.cardGrid}>
            {cards.map((uc, i) => (
              <div
                key={uc.id}
                className={[
                  styles.cardSlot,
                  revealed[i] ? styles.revealed : styles.hidden,
                  revealed[i] ? styles[`slot-${uc.card.rarity}`] ?? '' : '',
                ].join(' ')}
              >
                {revealed[i] && <Card userCard={uc} revealing />}
              </div>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <button className={styles.continueBtn} onClick={onClose}>
            Add to Collection
          </button>
        )}
      </div>
    </div>
  );
}
