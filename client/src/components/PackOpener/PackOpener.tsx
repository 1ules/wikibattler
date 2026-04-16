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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance through animation phases
  useEffect(() => {
    if (phase === 'sealed') {
      timerRef.current = setTimeout(() => setPhase('shaking'), 400);
    } else if (phase === 'shaking') {
      timerRef.current = setTimeout(() => setPhase('bursting'), 900);
    } else if (phase === 'bursting') {
      timerRef.current = setTimeout(() => {
        setPhase('revealing');
        revealCards();
      }, 500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  function revealCards() {
    cards.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        if (i === cards.length - 1) {
          setTimeout(() => setPhase('done'), 300);
        }
      }, i * 200);
    });
  }

  function handleSkip() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('done');
    setRevealed(cards.map(() => true));
  }

  function handlePackClick() {
    if (phase === 'sealed' || phase === 'shaking') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('bursting');
      timerRef.current = setTimeout(() => {
        setPhase('revealing');
        revealCards();
      }, 500);
    }
  }

  const showPack = phase === 'sealed' || phase === 'shaking' || phase === 'bursting';
  const showCards = phase === 'revealing' || phase === 'done';

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        {/* Skip button */}
        {phase !== 'done' && (
          <button className={styles.skipBtn} onClick={handleSkip}>
            Skip
          </button>
        )}

        {/* Pack visual */}
        {showPack && (
          <div
            className={[
              styles.packWrap,
              phase === 'shaking' ? styles.shaking : '',
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
            {phase === 'sealed' && (
              <p className={styles.packHint}>Click to open!</p>
            )}
          </div>
        )}

        {/* Burst particles */}
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

        {/* Card reveal grid */}
        {showCards && (
          <div className={styles.cardGrid}>
            {cards.map((uc, i) => (
              <div
                key={uc.id}
                className={[
                  styles.cardSlot,
                  revealed[i] ? styles.revealed : styles.hidden,
                ].join(' ')}
                style={{ '--delay': `${i * 0.15}s` } as React.CSSProperties}
              >
                {revealed[i] && (
                  <Card
                    userCard={uc}
                    revealing
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                )}
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
