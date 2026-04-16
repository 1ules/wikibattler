import React, { useEffect, useRef, useState } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { Card } from '../Card/Card.js';
import styles from './PackOpener.module.css';

type Phase = 'sealed' | 'shaking' | 'bursting' | 'revealing' | 'done';

// Rarities that trigger a flash effect
const FLASH_RARITIES = new Set(['SR', 'SSR', 'UR', 'MR']);
const FLASH_COLORS: Record<string, string> = {
  SR:  'rgba(251,146,60,0.22)',
  SSR: 'rgba(248,113,113,0.28)',
  UR:  'rgba(251,191,36,0.32)',
  MR:  'rgba(192,132,252,0.35)',
};
const PARTICLE_COUNTS: Record<string, number> = { SR: 0, SSR: 6, UR: 12, MR: 20 };

interface Particle { id: number; dx: number; color: string; size: number; }

interface PackOpenerProps {
  cards: UserCard[];
  onClose: () => void;
}

export function PackOpener({ cards, onClose }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [revealed, setRevealed] = useState<boolean[]>(() => cards.map(() => false));
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  // Phase-transition timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Reveal timers stored separately so phase cleanup never cancels them
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup all reveal timers on unmount
  useEffect(() => {
    return () => { revealTimersRef.current.forEach(clearTimeout); };
  }, []);

  // Auto-advance only after user click (shaking → bursting → revealing)
  useEffect(() => {
    if (phase === 'shaking') {
      timerRef.current = setTimeout(() => setPhase('bursting'), 800);
    } else if (phase === 'bursting') {
      timerRef.current = setTimeout(() => {
        setPhase('revealing');
        startReveal();
      }, 500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function spawnParticles(rarity: string) {
    const count = PARTICLE_COUNTS[rarity] ?? 0;
    if (count === 0) return;
    const colors = {
      SSR: ['#f87171', '#fb923c', '#fbbf24'],
      UR:  ['#fbbf24', '#f0c860', '#fde68a'],
      MR:  ['#c084fc', '#ec4899', '#6366f1', '#a855f7'],
    }[rarity] ?? ['#fff'];

    const newParticles: Particle[] = Array.from({ length: count }, () => ({
      id: ++particleId.current,
      dx: (Math.random() - 0.5) * 80,
      color: colors[Math.floor(Math.random() * colors.length)] ?? '#fff',
      size: 4 + Math.random() * 6,
    }));
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newParticles.some((n) => n.id === x.id)));
    }, 1200);
  }

  function triggerFlash(rarity: string) {
    const color = FLASH_COLORS[rarity];
    if (!color) return;
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 700);
  }

  function startReveal() {
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = cards.map((uc, i) =>
      setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        const rarity = uc.card.rarity;
        if (FLASH_RARITIES.has(rarity)) {
          triggerFlash(rarity);
          spawnParticles(rarity);
        }
        if (i === cards.length - 1) {
          const t = setTimeout(() => setPhase('done'), 400);
          revealTimersRef.current.push(t);
        }
      }, i * 260)
    );
  }

  function handleSkip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];
    setFlashColor(null);
    setParticles([]);
    setPhase('done');
    setRevealed(cards.map(() => true));
  }

  function handlePackClick() {
    if (phase === 'sealed') setPhase('shaking');
  }

  const showPack  = phase === 'sealed' || phase === 'shaking' || phase === 'bursting';
  const showCards = phase === 'revealing' || phase === 'done';

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog">
      {/* Rarity flash */}
      {flashColor && (
        <div
          className={styles.rarityFlash}
          style={{ background: `radial-gradient(ellipse at center, ${flashColor} 0%, transparent 70%)` }}
        />
      )}

      {/* Floating particles */}
      <div className={styles.particleLayer} aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.floatParticle}
            style={{
              '--dx': `${p.dx}px`,
              background: p.color,
              width: p.size,
              height: p.size,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className={styles.modal}>
        {phase !== 'done' && (
          <button className={styles.skipBtn} onClick={handleSkip}>Skip</button>
        )}

        {/* Pack visual */}
        {showPack && (
          <div
            className={[
              styles.packWrap,
              phase === 'shaking'  ? styles.shaking  : '',
              phase === 'bursting' ? styles.bursting : '',
            ].filter(Boolean).join(' ')}
            onClick={handlePackClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handlePackClick()}
            aria-label="Open pack"
          >
            <div className={styles.pack}>
              <div className={styles.packGlow} />
              <div className={styles.packCornerTL} />
              <div className={styles.packCornerBR} />
              <div className={styles.packBody}>
                <span className={styles.packIcon}>✦</span>
                <span className={styles.packLabel}>WikiBattler</span>
                <span className={styles.packSub}>Booster Pack</span>
              </div>
              <div className={styles.packShine} />
            </div>
            {phase === 'sealed' && (
              <p className={styles.packHint}>Click to open!</p>
            )}
          </div>
        )}

        {/* Burst particles */}
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

        {/* Card reveal grid */}
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

        {/* Continue button */}
        {phase === 'done' && (
          <button className={styles.continueBtn} onClick={onClose}>
            Add to Collection
          </button>
        )}
      </div>
    </div>
  );
}
