import { useNavigate, useParams } from 'react-router-dom'
import styles from './Corte.module.css'

// Layout compartilhado das 4 sub-páginas de análise de corte (Sprint 8.5).
// Renderiza topbar (back + título) + barra de 5 tabs navigando entre rotas irmãs.
// Padrão espelha Reproducao e ProducaoLeite (sibling routes).
const TABS = [
  { key: 'registro', label: 'Registro', path: '' },
  { key: 'graficos', label: 'Gráficos', path: 'graficos' },
  { key: 'ranking', label: 'Ranking', path: 'ranking' },
  { key: 'historico', label: 'Histórico', path: 'historico' },
  { key: 'alertas', label: 'Alertas', path: 'alertas' },
]

export default function SubpageLayout({ activeTab, children }) {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  function handleTab(tabKey) {
    const tab = TABS.find(t => t.key === tabKey)
    if (!tab) return
    if (tab.key === 'registro') {
      navigate(`/propriedade/${propriedadeId}/corte`)
    } else {
      navigate(`/propriedade/${propriedadeId}/corte/${tab.path}`)
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
          <div className={styles.pageTitle}>Desempenho de Corte</div>
          <div className={styles.pageSubtitle}>Análise de ganho de peso</div>
        </div>
      </header>

      <nav className={styles.corteTabs} aria-label="Seções de Desempenho de Corte">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.corteTab} ${activeTab === t.key ? styles.corteTabActive : ''}`}
            onClick={() => handleTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={styles.inner}>
        {children}
      </div>
    </div>
  )
}
