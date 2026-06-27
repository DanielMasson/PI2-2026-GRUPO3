import styles from './PropertyNav.module.css'

const NAV_ITEMS = [
  { key: 'inicio',     label: 'Início',     icone: '🏠' },
  { key: 'animais',    label: 'Animais',    icone: '🐄' },
  { key: 'reproducao', label: 'Reprodução', icone: '🤰' },
  { key: 'leite',      label: 'Leite',      icone: '🥛' },
]

/**
 * PropertyNav — barra de navegação inferior para páginas de propriedade.
 *
 * Props:
 *   activeTab — string: qual aba está ativa ('inicio' | 'animais' | ...)
 *   onNav     — função chamada ao clicar em uma aba (recebe a key)
 */
function PropertyNav({ activeTab = 'inicio', onNav }) {
  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
          onClick={() => onNav(item.key)}
        >
          <span className={styles.navIcon}>{item.icone}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default PropertyNav
