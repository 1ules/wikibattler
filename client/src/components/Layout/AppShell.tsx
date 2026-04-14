import { NavLink, Outlet } from 'react-router-dom';
import { PackTimer } from '../Timer/PackTimer.js';
import { useAuthStore } from '../../stores/authStore.js';
import styles from './AppShell.module.css';

export function AppShell() {
  const { isGuest, isAuthenticated } = useAuthStore();

  return (
    <div className={styles.shell}>
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

        <div className={styles.headerRight}>
          {isAuthenticated && <PackTimer />}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
