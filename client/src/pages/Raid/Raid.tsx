import styles from './Raid.module.css';

export default function Raid() {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>⚔️</div>
      <h1 className={styles.title}>Raid</h1>
      <span className={styles.badge}>Phase 2</span>
      <p className={styles.desc}>
        Team up and take on legendary bosses with your rarest cards.
        Raid rewards will include exclusive MR-tier cards and cosmetics.
      </p>
    </div>
  );
}
