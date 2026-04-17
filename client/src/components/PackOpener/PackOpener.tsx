import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { Card } from '../Card/Card.js';
import styles from './PackOpener.module.css';

type Phase = 'charging' | 'ready-fanfare' | 'sealed' | 'shaking' | 'bursting' | 'revealing' | 'done';

const FLASH_RARITIES = new Set(['SR', 'SSR', 'UR', 'MR']);
const RARITY_ORDER   = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR'];

const RARITY_CONFIG = {
  SR: {
    particleCount: 4,
    interval:      1800,
    novaInterval:  0,
    colors: ['#fb923c', '#f97316', '#fbbf24', '#f59e0b'],
    sizeMin: 3, sizeMax: 6,
    durMin: 1.6, durMax: 2.2,
    dxRange: 50,
    type: 'Ember' as const,
  },
  SSR: {
    particleCount: 8,
    interval:      1100,
    novaInterval:  0,
    colors: ['#f87171', '#ef4444', '#fb923c', '#fbbf24'],
    sizeMin: 4, sizeMax: 8,
    durMin: 1.0, durMax: 1.5,
    dxRange: 80,
    type: 'Spark' as const,
  },
  UR: {
    particleCount: 12,
    interval:      800,
    novaInterval:  0,
    colors: ['#fbbf24', '#f0c860', '#fde68a', '#facc15', '#fff7c0'],
    sizeMin: 5, sizeMax: 10,
    durMin: 0.9, durMax: 1.3,
    dxRange: 120,
    type: 'Star' as const,
  },
  MR: {
    particleCount: 16,
    interval:      700,
    novaInterval:  3200,
    colors: ['#c084fc', '#ec4899', '#6366f1', '#a855f7', '#818cf8', '#f472b6'],
    sizeMin: 6, sizeMax: 14,
    durMin: 0.8, durMax: 1.2,
    dxRange: 160,
    type: 'Orb' as const,
  },
} as const;

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

type ParticleType = 'Ember' | 'Spark' | 'Star' | 'Orb' | 'Nova';
interface FloatParticle { id: number; px: number; py: number; dx: number; angle: number; color: string; size: number; type: ParticleType; dur: number; }

interface PackOpenerProps {
  cards: UserCard[];
  isCharging: boolean;
  onClose: () => void;
}

export function PackOpener({ cards, isCharging, onClose }: PackOpenerProps) {
  const [phase, setPhase]               = useState<Phase>(isCharging ? 'charging' : 'sealed');
  const [revealed, setRevealed]         = useState<boolean[]>([]);
  const [floatParticles, setFloatParticles] = useState<FloatParticle[]>([]);
  const [showReadyBurst, setShowReadyBurst] = useState(false);
  const [peakRarity, setPeakRarity]     = useState<string | null>(null);
  const particleId    = useRef(0);
  const phaseTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const novaTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardsRef = useRef(cards);

  useEffect(() => { cardsRef.current = cards; }, [cards]);

  useEffect(() => {
    return () => {
      revealTimersRef.current.forEach(clearTimeout);
      if (phaseTimerRef.current)  clearTimeout(phaseTimerRef.current);
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      if (ambientRef.current)     clearInterval(ambientRef.current);
      if (novaTimerRef.current)   clearInterval(novaTimerRef.current);
    };
  }, []);

  const spawnParticles = useCallback((rarity: string, nova = false) => {
    const cfg = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
    if (!cfg) return;
    const count = nova ? 28 : cfg.particleCount;
    // All particles in a nova burst share the same spawn point
    const novaPx = Math.random() * 80 + 10;
    const novaPy = Math.random() * 75 + 10;
    const newParticles: FloatParticle[] = Array.from({ length: count }, (_, i) => ({
      id:    ++particleId.current,
      px:    nova ? novaPx : Math.random() * 90 + 5,
      py:    nova ? novaPy : Math.random() * 40 + 5,
      dx:    nova ? 0 : (Math.random() - 0.5) * 40,
      angle: nova ? (360 / count) * i : 0,
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)] ?? '#fff',
      size:  cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
      type:  nova ? 'Nova' : cfg.type,
      dur:   nova ? 0.8 + Math.random() * 0.4 : cfg.durMin + Math.random() * (cfg.durMax - cfg.durMin),
    }));
    const lifetime = nova ? 1200 : cfg.durMax * 1000 + 200;
    setFloatParticles(p => [...p, ...newParticles]);
    setTimeout(() => {
      setFloatParticles(p => p.filter(x => !newParticles.some(n => n.id === x.id)));
    }, lifetime);
  }, []);

  // Loop ambient particles (+ MR nova) while SR+ cards are visible
  useEffect(() => {
    const showCards = phase === 'revealing' || phase === 'done';
    if (showCards && peakRarity && FLASH_RARITIES.has(peakRarity)) {
      const cfg = RARITY_CONFIG[peakRarity as keyof typeof RARITY_CONFIG];
      ambientRef.current = setInterval(() => spawnParticles(peakRarity, false), cfg.interval);
      if (cfg.novaInterval > 0) {
        const firstNova = setTimeout(() => spawnParticles(peakRarity, true), 600);
        revealTimersRef.current.push(firstNova);
        novaTimerRef.current = setInterval(() => spawnParticles(peakRarity, true), cfg.novaInterval);
      }
    }
    return () => {
      if (ambientRef.current)   { clearInterval(ambientRef.current);   ambientRef.current = null; }
      if (novaTimerRef.current) { clearInterval(novaTimerRef.current); novaTimerRef.current = null; }
    };
  }, [phase, peakRarity, spawnParticles]);

  // When parent signals charging is done → play ready fanfare then unlock
  useEffect(() => {
    if (!isCharging && phase === 'charging') {
      setPhase('ready-fanfare');
      setShowReadyBurst(true);
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
          spawnParticles(rarity, false);
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
    if (ambientRef.current)     clearInterval(ambientRef.current);
    if (novaTimerRef.current)   clearInterval(novaTimerRef.current);
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];
    setFloatParticles([]);
    setShowReadyBurst(false);
    setPhase('done');
    setRevealed(cardsRef.current.map(() => true));
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
      {/* Rarity-specific ambient background — fades in smoothly, loops until closed */}
      {showCards && peakRarity && FLASH_RARITIES.has(peakRarity) && (
        <div className={styles.ambientFadeIn}>
          <div className={`${styles.ambientBase} ${styles[`ambient${peakRarity}`] ?? ''}`} />
          {peakRarity === 'UR' && <div className={styles.urRays} />}
          {peakRarity === 'MR' && <div className={styles.mrColorShift} />}
        </div>
      )}

      <div className={styles.particleLayer} aria-hidden="true">
        {floatParticles.map(p => (
          <div
            key={p.id}
            className={`${styles.floatParticle} ${styles[`particle${p.type}`] ?? ''}`}
            style={{
              '--px':    `${p.px}%`,
              '--py':    `${p.py}%`,
              '--dx':    `${p.dx}px`,
              '--angle': `${p.angle}deg`,
              '--dur':   `${p.dur}s`,
              background: p.color,
              color:      p.color,
              width:  p.size,
              height: p.size,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={styles.modal}>
        {(phase === 'revealing' || phase === 'done') && (
          <button className={styles.skipBtn} onClick={handleSkip}>Skip</button>
        )}

        {showPack && (
          <div className={styles.packScene}>
            <div className={styles.packMain}>
              {phase === 'charging' && (
                <div className={styles.chargeRing} aria-hidden="true">
                  {CHARGE_PARTICLES.map(p => (
                    <div
                      key={p.id}
                      className={styles.chargeParticle}
                      style={{
                        '--angle':  `${p.angle}deg`,
                        '--dist':   `${p.dist}px`,
                        '--dur':    `${p.dur}s`,
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
                  isChargingPhase           ? styles.packCharging   : '',
                  phase === 'ready-fanfare' ? styles.packReadyFlash : '',
                  phase === 'shaking'       ? styles.shaking        : '',
                  phase === 'bursting'      ? styles.bursting       : '',
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
