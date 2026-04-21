import React, { useRef, useEffect } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { RARITY_DISPLAY, QID_BLOCKLIST } from '@wikibattler/shared';
import styles from './Card.module.css';

const MAX_VISIBLE_TAGS = 3;

// Pull human-readable labels from the qidChain for display
function qidLabels(card: import('@wikibattler/shared').Card): string[] {
  const seen = new Set<string>();
  return (card.qidChain ?? [])
    .filter(n => !QID_BLOCKLIST.has(n.qid))
    .sort((a, b) => a.depth - b.depth)
    .map(n => n.label)
    .filter(label => {
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    });
}

interface CardProps {
  userCard: UserCard;
  revealing?: boolean;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
  tilt?: boolean;
  large?: boolean;
}

export function Card({
  userCard,
  revealing = false,
  onClick,
  selected = false,
  style,
  tilt = true,
  large = false,
}: CardProps) {
  const { card, isFoil } = userCard;
  const rarityInfo = RARITY_DISPLAY[card.rarity];
  const cardRef = useRef<HTMLElement>(null);
  const rafRef  = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const foilClass =
    isFoil && card.rarity === 'MR'  ? styles['foil-mr']  :
    isFoil && card.rarity === 'SSR' ? styles['foil-ssr'] :
    isFoil && card.rarity === 'UR'  ? styles['foil-ur']  :
    '';

  const themeClass       = styles[`theme-${card.rarity}`]       ?? '';
  const rarityBadgeClass = styles[`rarityBadge-${card.rarity}`] ?? '';

  const allLabels     = qidLabels(card);
  const visibleTags   = allLabels.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = Math.max(0, allLabels.length - MAX_VISIBLE_TAGS);
  const hasNoTags     = allLabels.length === 0;

  function applyTilt(clientX: number, clientY: number) {
    const el = cardRef.current;
    if (!el) return;
    const rect = rectRef.current ?? el.getBoundingClientRect();
    const dx = (clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const dy = (clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    el.style.setProperty('--tilt-x', `${(-dy * 14).toFixed(1)}deg`);
    el.style.setProperty('--tilt-y', `${( dx * 14).toFixed(1)}deg`);
    el.style.setProperty('--tilt-scale', '1.05');
    el.style.setProperty('--tilt-glare', `${Math.round((dx + 1) * 50)}%`);
  }

  function resetTilt() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--tilt-scale', '1');
    el.style.setProperty('--tilt-glare', '50%');
  }

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!tilt || revealing) return;
    applyTilt(e.clientX, e.clientY);
  }

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !tilt) return;

    let touchStart: { x: number; y: number } | null = null;

    function onTouchStart(e: TouchEvent) {
      if (!el) return;
      const t = e.touches[0];
      if (!t) return;
      touchStart = { x: t.clientX, y: t.clientY };
      rectRef.current = el.getBoundingClientRect(); // cache once — avoids layout on every move
      el.style.willChange = 'transform';            // promote to GPU layer for this interaction
    }

    function onTouchMove(e: TouchEvent) {
      if (revealing) return;
      const t = e.touches[0];
      if (!t || !touchStart) return;
      const dx = Math.abs(t.clientX - touchStart.x);
      const dy = Math.abs(t.clientY - touchStart.y);
      if (dx > dy) {
        e.preventDefault();
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        const cx = t.clientX, cy = t.clientY;
        rafRef.current = requestAnimationFrame(() => {
          applyTilt(cx, cy);
          rafRef.current = null;
        });
      }
    }

    function onTouchEnd() {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      touchStart = null;
      rectRef.current = null;
      if (el) el.style.willChange = 'auto'; // release GPU layer
      resetTilt();
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [tilt, revealing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article
      ref={cardRef}
      className={[
        styles.card,
        large ? styles.large : '',
        themeClass,
        foilClass,
        revealing ? styles.revealing : '',
        selected  ? styles.selected  : '',
      ].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${card.wikiTitle}, ${rarityInfo.label}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
    >
      {/* Glare layer */}
      <div className={styles.glare} aria-hidden="true" />

      {/* Header — single line with ellipsis, rarity badge never overlaps */}
      <header className={styles.header}>
        <span className={styles.name}>{card.wikiTitle}</span>
        <span className={[styles.rarityBadge, rarityBadgeClass].join(' ')}>
          {card.rarity}
        </span>
      </header>

      {/* Art */}
      <div className={styles.art}>
        {card.wikiThumbUrl ? (
          <img
            className={styles.artImage}
            src={card.wikiThumbUrl}
            alt={card.wikiTitle}
            loading="lazy"
          />
        ) : (
          <div className={styles.artFallback}>{card.wikiTitle}</div>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>ATK</span>
          <span className={styles.statValue}>{card.attack.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>HP</span>
          <span className={styles.statValue}>{card.health.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>SPD</span>
          <span className={styles.statValue}>{card.speed.toLocaleString()}</span>
        </div>
      </div>

      {/* Description — always rendered; CSS clamps to 2 lines */}
      <p className={styles.description}>{card.wikiExtract ?? ''}</p>

      {/* Flex spacer — pushes tags to the bottom regardless of description length */}
      <div className={styles.spacer} aria-hidden="true" />

      {/* WikiData type labels — only shown when populated */}
      {!hasNoTags && (
        <div className={styles.tags}>
          {visibleTags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
          {overflowCount > 0 && (
            <span className={styles.tagOverflow}>+{overflowCount}</span>
          )}
        </div>
      )}
    </article>
  );
}
