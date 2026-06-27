import styles from './BottomNav.module.css'

/**
 * BottomNav — barra de navegação inferior.
 *
 * Props:
 *   activeTab  — string: qual aba está ativa ('home' | 'settings' | ...)
 *   onHome     — função chamada ao clicar em Home
 *   onAdd      — função chamada ao clicar no botão "+"
 *   onSettings — função chamada ao clicar em Ajustes
 */
function BottomNav({ activeTab = 'home', onHome, onAdd, onSettings }) {
  return (
    <nav className={styles.nav}>
      {/* Home */}
      <button
        className={`${styles.tab} ${activeTab === 'home' ? styles.tabActive : ''}`}
        onClick={onHome}
        aria-label="Início"
      >
        <span className={styles.tabIcon}>🏠</span>
        <span className={styles.tabLabel}>Início</span>
      </button>

      {/* Botão central de ação (+) */}
      <div className={styles.addWrapper}>
        <button
          className={styles.addBtn}
          onClick={onAdd}
          aria-label="Adicionar propriedade"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Ajustes */}
      <button
        className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
        onClick={onSettings}
        aria-label="Ajustes"
      >
        <span className={styles.tabIcon}>⚙️</span>
        <span className={styles.tabLabel}>Ajustes</span>
      </button>
    </nav>
  )
}

export default BottomNav
