import { useNavigate, useParams } from 'react-router-dom'
import styles from './ProducaoLeite.module.css'

// Layout compartilhado das 4 sub-páginas de análise leiteira (Sprint 8).
// Renderiza topbar (back + título) + barra de 5 tabs navigando entre rotas irmãs.
// Padrão espelha Reproducao (sibling routes), NÃO HealthModule (?aba=).
const TABS = [
  { key: 'registro', label: 'Registro', path: 'registro' },
  { key: 'graficos', label: 'Gráficos', path: 'graficos' },
  { key: 'comparativo', label: 'Comparativo', path: 'comparativo' },
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
      navigate(`/propriedade/${propriedadeId}/producao-leite`)
    } else {
      navigate(`/propriedade/${propriedadeId}/producao-leite/${tab.path}`)
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
          <div className={styles.pageTitle}>Desempenho Leiteiro</div>
          <div className={styles.pageSubtitle}>Análise da produção</div>
        </div>
      </header>

      <nav className={styles.milkTabs} aria-label="Seções de Desempenho Leiteiro">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.milkTab} ${activeTab === t.key ? styles.milkTabActive : ''}`}
            onClick={() => handleTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.inner}>
        {children}
      </main>
    </div>
  )
}
