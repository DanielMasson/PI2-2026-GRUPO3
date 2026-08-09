import { useParams } from 'react-router-dom'
import { useAlertasCortePropriedade } from '../../../hooks/usePesagemAnalise'
import SubpageLayout from '../_SubpageLayout'
import styles from '../Corte.module.css'

const TIPO_LABEL = {
  perda: 'Perda de peso',
  estagnacao: 'Estagnação',
  pronto_abate: 'Pronto para abate',
}

function formatarKg(v) {
  if (v == null) return '—'
  return `${v.toFixed(2)} kg`
}

function formatarGmd(v) {
  if (v == null) return '—'
  return `${v.toFixed(3)} kg/dia`
}

function formatarPct(v) {
  if (v == null) return '—'
  return `${v.toFixed(0)}%`
}

export default function CorteAlertas() {
  const { propriedadeId } = useParams()
  const { alertas, carregando, erro } = useAlertasCortePropriedade(propriedadeId)

  const perda = alertas.perda || []
  const estagnacao = alertas.estagnacao || []
  const prontoAbate = alertas.pronto_abate || []
  const total = perda.length + estagnacao.length + prontoAbate.length

  return (
    <SubpageLayout activeTab="alertas">
      <p className={styles.resumoSub}>
        Detecta perda de peso (GMD negativo), estagnação (GMD baixo sustentado)
        e animais prontos para abate (95% ou mais do peso estimado).
      </p>

      {erro && <div className={styles.errorToast}>{erro}</div>}
      {carregando && <p className={styles.emptyState}>Carregando...</p>}

      {!carregando && total === 0 && !erro && (
        <div className={styles.emptyState}>
          Nenhum alerta. Rebanho estável e sem animais prontos para abate.
        </div>
      )}

      {!carregando && total > 0 && (
        <>
          {perda.length > 0 && (
            <>
              <h4 className={styles.alertasGroupTitle}>Perda de peso ({perda.length})</h4>
              {perda.map(a => <AlertaCard key={a.uuid} a={a} tipo="perda" />)}
            </>
          )}
          {estagnacao.length > 0 && (
            <>
              <h4 className={styles.alertasGroupTitle}>Estagnação ({estagnacao.length})</h4>
              {estagnacao.map(a => <AlertaCard key={a.uuid} a={a} tipo="estagnacao" />)}
            </>
          )}
          {prontoAbate.length > 0 && (
            <>
              <h4 className={styles.alertasGroupTitle}>Pronto para abate ({prontoAbate.length})</h4>
              {prontoAbate.map(a => <AlertaCard key={a.uuid} a={a} tipo="pronto_abate" />)}
            </>
          )}
        </>
      )}
    </SubpageLayout>
  )
}

function AlertaCard({ a, tipo }) {
  // Reusa classes alerta_critica/severa/moderada para coloração por tipo
  const classeCor = tipo === 'perda'
    ? styles.alerta_critica
    : tipo === 'estagnacao'
    ? styles.alerta_moderada
    : styles.alerta_severa

  return (
    <div className={`${styles.alertaCard} ${classeCor}`}>
      <div className={styles.alertaHeader}>
        <div>
          <div className={styles.alertaNome}>{a.nome}</div>
          {a.id_fisico && <div className={styles.alertaSub}>{a.id_fisico}</div>}
        </div>
        <span className={styles.alertaBadge}>{TIPO_LABEL[tipo]}</span>
      </div>
      <div className={styles.alertaStats}>
        <div>
          <span className={styles.alertaStatLabel}>Peso atual</span>
          <span className={styles.alertaStatValor}>{formatarKg(a.peso_atual)}</span>
        </div>
        <div>
          <span className={styles.alertaStatLabel}>GMD</span>
          <span className={styles.alertaStatValor}>{formatarGmd(a.gmd)}</span>
        </div>
        {tipo === 'pronto_abate' ? (
          <>
            <div>
              <span className={styles.alertaStatLabel}>Peso abate</span>
              <span className={styles.alertaStatValor}>{formatarKg(a.peso_abate_estimado)}</span>
            </div>
            <div>
              <span className={styles.alertaStatLabel}>% atingido</span>
              <span className={styles.alertaStatValor}>{formatarPct(a.pct_abate)}</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className={styles.alertaStatLabel}>Peso abate</span>
              <span className={styles.alertaStatValor}>{formatarKg(a.peso_abate_estimado)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
