import React, { useEffect, useRef, useState } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { Card } from '../Card/Card.js';
import styles from './PackOpener.module.css';

type Phase = 'sealed' | 'shaking' | 'bursting' | 'revealing' | 'done';

interface PackOpenerProps {
  cards: UserCard[];
  onClose: () => void;
}

export function PackOpener({ cards, onClose }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [revealed, setRevealed] = useState<boolean[]>(() => cards.map(() => false));
  // Phase-transition timer — cleared by useEffect cleanup
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Reveal timers stored separately so useEffect cleanup never cancels them
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup all reveal timers on unmount
  useEffect(() => {
    return () => {
      revealTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Auto-advance through phases
  useEffect(() => {
    if (phase === 'sealed') {
      timerRef.current = setTimeout(() => setPhase('shaking'), 400);
    } else if (phase === 'shaking') {
      timerRef.current = setTimeout(() => setPhase('bursting'), 900);
    } else if (phase === 'bursting') {
      timerRef.current = setTimeout(() => {
        setPhase('revealing');
        startReveal();
      }, 500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function startReveal() {
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = cards.map((_, i) =>
      setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        if (i === cards.length - 1) {
          const doneTimer = setTimeout(() => setPhase('done'), 300);
          revealTimersRef.current.push(doneTimer);
        }
      }, i * 220)
    );
  }

  function handleSkip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];
    setPhase('done');
    setRevealed(cards.map(() => true));
  }

  function handlePackClick() {
    if (phase === 'sealed' || phase === 'shaking') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('bursting');
      timerRef.current = setTimeout(() => {
        setPhase('revealing');
        startReveal();
      }, 500);
    }
  }

  const showPack  = phase === 'sealed' || phase === 'shaking' || phase === 'bursting';
  const showCards = phase === 'revealing' || phase === 'done';

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        {phase !== 'done' && (
          <button className={styles.skipBtn} onClick={handleSkip}>
            Skip
          </button>
        )}

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
              <div className={styles.packBody}>
                <span className={styles.packLabel}>WikiBattler</span>
                <span className={styles.packSub}>Booster Pack</span>
              </div>
              <div className={styles.packShine} />
            </div>
            {phase === 'sealed' && <p className={styles.packHint}>Click to open!</p>}
          </div>
        )}

        {phase === 'bursting' && (
          <div className={styles.burstParticles}>
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={styles.particle}
                style={{ '--angle': `${i * 30}deg` } as React.CSSProperties}
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
