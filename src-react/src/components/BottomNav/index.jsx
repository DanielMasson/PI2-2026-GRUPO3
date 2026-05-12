import styles from './BottomNav.module.css'

/**
 * BottomNav — barra de navegação inferior.
 *
 * Props:
 *   activeTab  — string: qual aba está ativa ('home' | 'settings' | ...)
 *   onHome     — função chamada ao clicar em Home
 *   onAdd      — função chamada ao clicar no botão "+"
 *   onSettings — função chamada ao clicar em Ajustes
 *
 * Para adicionar abas futuras (ex: dentro de uma propriedade),
 * basta passar novas props e renderizá-las condicionalmente.
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
        <span className={styles.tabIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </span>
        <span className={styles.tabLabel}>Home</span>
      </button>

      {/* Botão central de ação (+) */}
      <div className={styles.addWrapper}>
        <button
          className={styles.addBtn}
          onClick={onAdd}
          aria-label="Adicionar propriedade"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
        <span className={styles.tabIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </span>
        <span className={styles.tabLabel}>Ajustes</span>
      </button>
    </nav>
  )
}

export default BottomNav
