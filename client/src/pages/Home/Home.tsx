import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useCreateGuest } from '../../api/useAuth.js';
import styles from './Home.module.css';

const FEATURES = [
  { icon: '📚', title: 'Wikipedia Cards', desc: 'Every card is a real Wikipedia article. Infinite content, zero curation.' },
  { icon: '⚔️', title: '200+ Synergies', desc: 'Build layered combos. 5 Animals + Africa + Herbivore = regen tank.' },
  { icon: '👻', title: 'Ghost Battles', desc: 'Battle async against saved teams. No waiting, always a match.' },
  { icon: '🎴', title: 'Quality Rarity', desc: 'Better articles = rarer cards. Cheetah vs Russo-Persian Wars.' },
];

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const createGuest = useCreateGuest();

  async function handleStart() {
    if (isAuthenticated) {
      navigate('/collection');
    } else {
      await createGuest.mutateAsync();
      navigate('/collection');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>WikiBattler</h1>
        <p className={styles.subtitle}>
          Collect cards from Wikipedia. Build synergy teams. Battle the world.
          Every article is a card. Every card tells a story.
        </p>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleStart} disabled={createGuest.isPending}>
            {createGuest.isPending ? 'Starting...' : isAuthenticated ? 'Open Collection' : 'Play Free'}
          </button>
          {!isAuthenticated && (
            <button className={styles.btnSecondary} onClick={() => navigate('/collection')}>
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.feature}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span className={styles.featureTitle}>{f.title}</span>
            <span className={styles.featureDesc}>{f.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
