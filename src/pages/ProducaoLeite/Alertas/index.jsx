import { useParams } from 'react-router-dom'
import { useAlertasQuedaLeite } from '../../../hooks/useProducaoLeiteAnalise'
import SubpageLayout from '../_SubpageLayout'
import styles from '../ProducaoLeite.module.css'

const SEVERIDADE_LABEL = {
  critica: 'Crítica',
  severa: 'Severa',
  moderada: 'Moderada',
}

function formatarPct(pct) {
  if (pct == null) return '—'
  return `${pct.toFixed(1)}%`
}

function formatarLitros(v) {
  if (v == null) return '—'
  return `${v.toFixed(1)} L`
}

export default function ProducaoLeiteAlertas() {
  const { propriedadeId } = useParams()
  const { alertas, carregando, erro } = useAlertasQuedaLeite(propriedadeId)

  const criticas = alertas.filter(a => a.severidade === 'critica')
  const severas = alertas.filter(a => a.severidade === 'severa')
  const moderadas = alertas.filter(a => a.severidade === 'moderada')

  return (
    <SubpageLayout activeTab="alertas">
      <p className={styles.resumoSub}>
        Alerta dispara quando produção cai &ge;20% (dia-a-dia) ou &ge;30% (média 7d vs 7d anterior).
      </p>

      {erro && <div className={styles.errorToast}>{erro}</div>}
      {carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!carregando && alertas.length === 0 && !erro && (
        <div className={styles.emptyState}>
          Nenhuma queda brusca detectada. Produção estável.
        </div>
      )}

      {!carregando && alertas.length > 0 && (
        <>
          {criticas.length > 0 && (
            <>
              <h4 className={styles.alertasGroupTitle}>Críticas ({criticas.length})</h4>
              {criticas.map(a => <AlertaCard key={a.uuid} a={a} />)}
            </>
          )}
          {severas.length > 0 && (
            <>
              <h4 className={styles.alertasGroupTitle}>Severas ({severas.length})</h4>
              {severas.map(a => <AlertaCard key={a.uuid} a={a} />)}
            </>
          )}
          {moderadas.length > 0 && (
            <>
              <h4 className={styles.alertasGroupTitle}>Moderadas ({moderadas.length})</h4>
              {moderadas.map(a => <AlertaCard key={a.uuid} a={a} />)}
            </>
          )}
        </>
      )}
    </SubpageLayout>
  )
}

function AlertaCard({ a }) {
  return (
    <div className={`${styles.alertaCard} ${styles[`alerta_${a.severidade}`]}`}>
      <div className={styles.alertaHeader}>
        <div>
          <div className={styles.alertaNome}>{a.nome}</div>
          {a.id_fisico && <div className={styles.alertaSub}>{a.id_fisico}</div>}
        </div>
        <span className={styles.alertaBadge}>
          {SEVERIDADE_LABEL[a.severidade]}
        </span>
      </div>
      <div className={styles.alertaStats}>
        <div>
          <span className={styles.alertaStatLabel}>Hoje</span>
          <span className={styles.alertaStatValor}>{formatarLitros(a.total_dia)}</span>
        </div>
        <div>
          <span className={styles.alertaStatLabel}>Ontem</span>
          <span className={styles.alertaStatValor}>{formatarLitros(a.total_dia_anterior)}</span>
        </div>
        <div>
          <span className={styles.alertaStatLabel}>Var. dia-a-dia</span>
          <span className={styles.alertaStatValor}>{formatarPct(a.variacao_dia_dia)}</span>
        </div>
        <div>
          <span className={styles.alertaStatLabel}>Var. 7d vs ant.</span>
          <span className={styles.alertaStatValor}>{formatarPct(a.variacao_7d)}</span>
        </div>
      </div>
    </div>
  )
}
