import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './PropertyHome.module.css'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import { usePropriedade } from '../../contexts/PropriedadeContext'
import { useAlertas } from '../../hooks/useAlertas'
import { useAnimais } from '../../hooks/useAnimais'
import { useGestantes } from '../../hooks/useGestantes'

/* ─── Helpers ─── */

const ALERTA_ICONE_MAP = {
  vacina_vencida: '\u{1FA7A}',
  vacina_proxima: '\u{1FA7A}',
  carencia_liberada: '\u26A0\uFE0F',
  carencia_proxima: '\u26A0\uFE0F',
  carencia_ativa: '\u26A0\uFE0F',
  parto_proximo: '\uD83D\uDC04',
  parto_atrasado: '\uD83D\uDC04',
}

function tempoRelativo(dias) {
  if (dias === null || dias === undefined) return ''
  const abs = Math.abs(dias)
  if (abs === 0) return 'Hoje'
  if (abs === 1) dias < 0 ? 'Há 1 dia' : 'Em 1 dia'
  if (abs < 7) return dias < 0 ? `Há ${abs} dias` : `Em ${abs} dias`
  if (abs < 30) {
    const semanas = Math.floor(abs / 7)
    return dias < 0 ? `Há ${semanas} semana${semanas > 1 ? 's' : ''}` : `Em ${semanas} semana${semanas > 1 ? 's' : ''}`
  }
  const meses = Math.floor(abs / 30)
  return dias < 0 ? `Há ${meses} mês${meses > 1 ? 'es' : ''}` : `Em ${meses} mês${meses > 1 ? 'es' : ''}`
}

function StatBox({ label, value, unit, sub, className }) {
  return (
    <div className={className || styles.herdStat}>
      <div className={styles.herdStatLabel}>{label}</div>
      <div className={styles.herdStatValue}>
        {value !== null && value !== undefined ? value : '—'}
        {value !== null && value !== undefined && unit && (
          <span className={styles.milkStatUnit}> {unit}</span>
        )}
      </div>
      {sub && <div className={styles.herdStatSub}>{sub}</div>}
    </div>
  )
}

/* ─── Página principal ─── */
function PropertyHome() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()

  const { propriedade, selecionarPropriedade, carregando: carregandoPropriedade } = usePropriedade()
  const { alertas, carregando: carregandoAlertas } = useAlertas(propriedadeId)
  const { animais, carregando: carregandoAnimais } = useAnimais(propriedadeId)
  const { gestantes, carregando: carregandoGestantes } = useGestantes(propriedadeId)

  useEffect(() => {
    if (propriedadeId) {
      selecionarPropriedade(propriedadeId)
    }
  }, [propriedadeId, selecionarPropriedade])

  const alertasUI = useMemo(() =>
    alertas.map(a => ({
      uuid: a.uuid || a.tipo + a.titulo + a.descricao,
      tipo: a.nivel || 'info',
      icone: ALERTA_ICONE_MAP[a.tipo] || '\u2139\uFE0F',
      titulo: a.titulo,
      descricao: a.descricao,
      tempo: tempoRelativo(a.tempo),
    })),
    [alertas]
  )

  const rebanho = useMemo(() => {
    const totalAnimais = animais.length
    const machos = animais.filter(a => a.sexo === 'macho').length
    const femeas = animais.filter(a => a.sexo === 'femea').length
    const prenhas = carregandoGestantes ? null : gestantes.length
    const vazias = carregandoGestantes ? null : Math.max(0, femeas - gestantes.length)
    return { totalAnimais, prenhas, vazias, machos, femeas }
  }, [animais, gestantes, carregandoGestantes])

  return (
    <div className={styles.screen}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ←
          </button>
          <div>
            <div className={styles.topbarTitle}>
              {carregandoPropriedade ? 'Carregando...' : (propriedade?.nome || 'Propriedade')}
            </div>
            <div className={styles.topbarSub}>
              {propriedade?.localizacao || ''}
            </div>
          </div>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.iconBtn} title="Configurações" onClick={() => navigate('/configuracoes')}>⚙️</button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className={styles.scrollArea}>

        {/* ══ ALERTAS ══ */}
        <section className={styles.alertsSection}>
          <p className={styles.sectionLabel}>⚡ Alertas</p>

          {carregandoAlertas ? (
            <div className={styles.noAlerts}>Carregando alertas...</div>
          ) : alertasUI.length === 0 ? (
            <div className={styles.noAlerts}>
              Nenhum alerta no momento ✓
            </div>
          ) : (
            alertasUI.map(alert => (
              <div
                key={alert.uuid}
                className={`${styles.alertCard} ${styles['alert' + alert.tipo.charAt(0).toUpperCase() + alert.tipo.slice(1)]}`}
              >
                <span className={styles.alertIcon}>{alert.icone}</span>
                <div className={styles.alertBody}>
                  <div className={styles.alertTitle}>{alert.titulo}</div>
                  <div className={styles.alertDesc}>{alert.descricao}</div>
                  <div className={styles.alertTime}>{alert.tempo}</div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* ══ REBANHO ══ */}
        <section className={styles.herdSection}>
          <p className={styles.sectionLabel}>🐄 Resumo do Rebanho</p>

          <div className={styles.herdCard}>
            <div className={styles.herdHeader}>
              <div className={styles.herdHeaderLeft}>
                <span className={styles.herdIcon}>🌾</span>
                <div>
                  <div className={styles.herdTitle}>Visão geral</div>
                  <div className={styles.herdTotal}>
                    {carregandoAnimais
                      ? 'Carregando...'
                      : `${rebanho.totalAnimais} animais`}
                  </div>
                </div>
              </div>
              <span className={styles.herdBadge}>Rebanho</span>
            </div>

            <div className={styles.herdGrid}>
              <StatBox label="Total animais" value={rebanho.totalAnimais} />
              <StatBox label="Prenhas" value={rebanho.prenhas} />
              <StatBox label="Vazias" value={rebanho.vazias} />
              <StatBox label="Machos" value={rebanho.machos} />
              <StatBox label="Fêmeas" value={rebanho.femeas} />
            </div>
          </div>
        </section>

      </main>

      {/* ── Bottom Nav ── */}
      <PropertyNav />

    </div>
  )
}

export default PropertyHome
