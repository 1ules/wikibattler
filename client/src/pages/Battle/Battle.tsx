import styles from './Battle.module.css';

export function Battle() {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🗡️</div>
      <h1 className={styles.title}>Battle</h1>
      <span className={styles.badge}>Phase 2</span>
      <p className={styles.desc}>
        Build your team of 5 and fight ghost teams from other players.
        Synergies, strategy, and rare cards will decide the victor.
      </p>
    </div>
  );
}
