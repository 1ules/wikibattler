import React, { useRef } from 'react';
import type { UserCard } from '@wikibattler/shared';
import { RARITY_DISPLAY } from '@wikibattler/shared';
import styles from './Card.module.css';

interface CardProps {
  userCard: UserCard;
  revealing?: boolean;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
  tilt?: boolean;
}

export function Card({
  userCard,
  revealing = false,
  onClick,
  selected = false,
  style,
  tilt = true,
}: CardProps) {
  const { card, isFoil } = userCard;
  const rarityInfo = RARITY_DISPLAY[card.rarity];
  const cardRef = useRef<HTMLElement>(null);

  const foilClass =
    isFoil && card.rarity === 'MR'  ? styles['foil-mr']  :
    isFoil && card.rarity === 'SSR' ? styles['foil-ssr'] :
    '';

  const rarityBorderClass = styles[`rarity-${card.rarity}`] ?? '';
  const rarityBadgeClass  = styles[`rarityBadge-${card.rarity}`] ?? '';

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!tilt || revealing) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    el.style.setProperty('--tilt-x', `${(-dy * 14).toFixed(1)}deg`);
    el.style.setProperty('--tilt-y', `${( dx * 14).toFixed(1)}deg`);
    el.style.setProperty('--tilt-scale', '1.05');
    el.style.setProperty('--tilt-glare', `${Math.round((dx + 1) * 50)}%`);
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--tilt-scale', '1');
    el.style.setProperty('--tilt-glare', '50%');
  }

  return (
    <article
      ref={cardRef}
      className={[
        styles.card,
        rarityBorderClass,
        foilClass,
        revealing ? styles.revealing : '',
        selected  ? styles.selected  : '',
      ].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${card.wikiTitle}, ${rarityInfo.label}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glare layer */}
      <div className={styles.glare} aria-hidden="true" />

      {/* Header */}
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

      {/* Description */}
      {card.wikiExtract && (
        <p className={styles.description}>{card.wikiExtract}</p>
      )}

      {/* Tags */}
      {(card.tags?.length ?? 0) > 0 && (
        <div className={styles.tags}>
          {card.tags.slice(0, 5).map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}
