import React, { useRef } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { RARITY_DISPLAY } from '@wikibattler/shared';
import styles from './Card.module.css';

const MAX_VISIBLE_TAGS = 3;

// Pull human-readable labels from the qidChain for display
function qidLabels(card: import('@wikibattler/shared').Card): string[] {
  return (card.qidChain ?? [])
    .filter(n => n.depth === 0)   // only direct types shown on card face
    .map(n => n.label);
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

  const foilClass =
    isFoil && card.rarity === 'MR'  ? styles['foil-mr']  :
    isFoil && card.rarity === 'SSR' ? styles['foil-ssr'] :
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
    const rect = el.getBoundingClientRect();
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

  function handleTouchMove(e: React.TouchEvent<HTMLElement>) {
    if (!tilt || revealing) return;
    const touch = e.touches[0];
    if (touch) applyTilt(touch.clientX, touch.clientY);
  }

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
      onTouchMove={handleTouchMove}
      onTouchEnd={resetTilt}
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
