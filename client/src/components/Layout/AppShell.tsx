import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { usePackState } from '../../api/usePacks.js';
import styles from './AppShell.module.css';

function PackStateSync() {
  usePackState();
  return null;
}

export function AppShell() {
  const { isGuest, isAuthenticated } = useAuthStore();

  return (
    <div className={styles.shell}>
      {isAuthenticated && <PackStateSync />}
      <header className={styles.header}>
        <span className={styles.logo}>WikiBattler</span>

        <nav className={styles.nav}>
          <NavLink to="/"           className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Home</NavLink>
          <NavLink to="/collection" className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Collection</NavLink>
          <NavLink to="/battle"     className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Battle</NavLink>
          {!isGuest && (
            <NavLink to="/market" className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Market</NavLink>
          )}
          <NavLink to="/leaderboard" className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Ranks</NavLink>
        </nav>

        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
