import { useNavigate, useParams } from 'react-router-dom'
import styles from './Financeiro.module.css'

// Layout compartilhado das sub-páginas de Finanças (Sprint 10).
// Renderiza topbar (back + título) + barra de 3 tabs navigando entre rotas irmãs.
// Padrão espelha Corte e ProducaoLeite (sibling routes).
const TABS = [
  { key: 'dashboard', label: 'Dashboard', path: '' },
  { key: 'listar', label: 'Transações', path: 'listar' },
  { key: 'por-animal', label: 'Por Animal', path: 'por-animal' },
  { key: 'relatorios', label: 'Relatórios', path: 'relatorios' },
]

export default function SubpageLayout({ activeTab, children }) {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  function handleTab(tabKey) {
    const tab = TABS.find(t => t.key === tabKey)
    if (!tab) return
    if (tab.key === 'dashboard') {
      navigate(`/propriedade/${propriedadeId}/financeiro`)
    } else {
      navigate(`/propriedade/${propriedadeId}/financeiro/${tab.path}`)
    }
  }

  function handleBack() {
    navigate(`/propriedade/${propriedadeId}`)
  }

  return (
    <div className={styles.container}>
      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={handleBack} aria-label="Voltar">←</button>
        <div>
          <div className={styles.pageTitle}>Finanças</div>
          <div className={styles.pageSubtitle}>Fluxo de caixa da propriedade</div>
        </div>
      </header>

      <nav className={styles.financeiroTabs} aria-label="Seções de Finanças">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.financeiroTab} ${activeTab === t.key ? styles.financeiroTabActive : ''}`}
            onClick={() => handleTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={styles.inner}>{children}</div>
    </div>
  )
}
