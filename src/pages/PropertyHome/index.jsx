import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './PropertyHome.module.css'
import PropertyNav from '../../components/PropertyNav/index.jsx'
import { usePropriedade } from '../../contexts/PropriedadeContext'
import { useAlertas } from '../../hooks/useAlertas'
import { useAnimais } from '../../hooks/useAnimais'
import { useGestantes } from '../../hooks/useGestantes'

/* ─── Helpers ─── */

/** Map useAlertas tipo to the alert icone */
const ALERTA_ICONE_MAP = {
  vacina_vencida: '\u{1FA7A}',
  vacina_proxima: '\u{1FA7A}',
  carencia_liberada: '\u26A0\uFE0F',
  carencia_proxima: '\u26A0\uFE0F',
  carencia_ativa: '\u26A0\uFE0F',
  parto_proximo: '\uD83D\uDC04',
  parto_atrasado: '\uD83D\uDC04',
}

/** Convert a day-count to a human-readable relative time string */
function tempoRelativo(dias) {
  if (dias === null || dias === undefined) return ''
  const abs = Math.abs(dias)
  if (abs === 0) return 'Hoje'
  if (abs === 1) return dias < 0 ? 'Há 1 dia' : 'Em 1 dia'
  if (abs < 7) return dias < 0 ? `Há ${abs} dias` : `Em ${abs} dias`
  if (abs < 30) {
    const semanas = Math.floor(abs / 7)
    return dias < 0 ? `Há ${semanas} semana${semanas > 1 ? 's' : ''}` : `Em ${semanas} semana${semanas > 1 ? 's' : ''}`
  }
  const meses = Math.floor(abs / 30)
  return dias < 0 ? `Há ${meses} mês${meses > 1 ? 'es' : ''}` : `Em ${meses} mês${meses > 1 ? 'es' : ''}`
}

/* ─── Componentes auxiliares ─── */
function StatBox({ label, value, unit, sub, className }) {
  return (
    <div className={className || styles.herdStat}>
      <div className={styles.herdStatLabel}>{label}</div>
      <div className={styles.herdStatValue}>
        {value !== null && value !== undefined ? value : <EmptyValue />}
        {value !== null && value !== undefined && unit && (
          <span className={styles.milkStatUnit}> {unit}</span>
        )}
      </div>
      {sub && <div className={styles.herdStatSub}>{sub}</div>}
    </div>
  )
}

function EmptyValue() {
  return (
    <span style={{ color: 'rgba(155,146,184,0.25)', fontSize: '1rem', fontWeight: 400 }}>
      —
    </span>
  )
}

function ImgSlot({ label = '+ adicionar imagem' }) {
  return <div className={styles.imgSlot}>{label}</div>
}

/* ─── Página principal ─── */
function PropertyHome() {
  const navigate = useNavigate()
  const { propriedadeId } = useParams()
  const [activeTab, setActiveTab] = useState('inicio')

  // ── Context & hooks ──
  const { propriedade, selecionarPropriedade, carregando: carregandoPropriedade } = usePropriedade()
  const { alertas, carregando: carregandoAlertas } = useAlertas(propriedadeId)
  const { animais, carregando: carregandoAnimais } = useAnimais(propriedadeId)
 const { gestantes, carregando: carregandoGestantes } = useGestantes(propriedadeId)

  // Select the property in context when the page loads
  useEffect(() => {
    if (propriedadeId) {
      selecionarPropriedade(propriedadeId)
    }
  }, [propriedadeId, selecionarPropriedade])

  // ── Map alertas to UI format ──
  const alertasUI = useMemo(() =>
    alertas.map(a => {
          return {
        uuid: a.uuid || a.tipo + a.titulo + a.descricao,
        tipo: a.nivel || 'info',
        icone: ALERTA_ICONE_MAP[a.tipo] || '\u2139\uFE0F',
        titulo: a.titulo,
        descricao: a.descricao,
        tempo: tempoRelativo(a.tempo),
      }
    }),
    [alertas]
  )

  // ── Rebanho stats from animais ──
  const rebanho = useMemo(() => {
    const totalAnimais = animais.length
    const machos = animais.filter(a => a.sexo === 'macho').length
    const femeas = animais.filter(a => a.sexo === 'femea').length
    const prenhas = carregandoGestantes ? null : gestantes.length
    const vazias = carregandoGestantes ? null : Math.max(0, femeas - gestantes.length)
    return {
      totalAnimais,
      lotes: null, // no lote concept in current schema
      prenhas,
      vazias,
      machos,
      femeas,
    }
  }, [animais, gestantes, carregandoGestantes])

  // ── Leite — post-MVP, keep empty values ──
  const leite = {
    dataColeta: null,
    totalLitros: null,
    mediaPorVaca: null,
    vacasEmLactacao: null,
    metaDiaria: null,
  }

  // ── Financeiro — post-MVP, keep empty values ──
  const financeiro = {
    periodo: null,
    receita: null,
    despesa: null,
    saldo: null,
    percentualMeta: 0,
  }

  function handleNav(key) {
    if (key === 'animais') {
      navigate(`/propriedade/${propriedadeId}/animais`)
    } else if (key === 'reproducao') {
      navigate(`/propriedade/${propriedadeId}/reproducao`)
    } else if (key === 'leite') {
      navigate(`/propriedade/${propriedadeId}/producao-leite`)
    } else {
      setActiveTab(key)
    }
  }

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
          <button className={styles.iconBtn} title="Notificações">🔔</button>
          <button className={styles.iconBtn} title="Configurações" onClick={() => navigate('/configuracoes')}>⚙️</button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className={styles.scrollArea}>

        {/* ══ 1. ALERTAS ══ */}
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

        {/* ══ 2. PRODUÇÃO DE LEITE ══ */}
        <section className={styles.milkSection}>
          <p className={styles.sectionLabel}>🥛 Produção de Leite</p>

          <div className={styles.milkCard}>
            <div className={styles.milkHeader}>
              <div className={styles.milkHeaderLeft}>
                <span className={styles.milkIcon}>🐮</span>
                <div>
                  <div className={styles.milkTitle}>Última coleta</div>
                  <div className={styles.milkDate}>{leite.dataColeta || <EmptyValue />}</div>
                </div>
              </div>
              <span className={styles.milkBadge}>Leite</span>
            </div>

            <div className={styles.milkStats}>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Total coletado</div>
                <div className={styles.milkStatValue}>
                  {leite.totalLitros !== null ? leite.totalLitros : <EmptyValue />}
                  {leite.totalLitros !== null && <span className={styles.milkStatUnit}>L</span>}
                </div>
              </div>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Média por vaca</div>
                <div className={styles.milkStatValue}>
                  {leite.mediaPorVaca !== null ? leite.mediaPorVaca : <EmptyValue />}
                  {leite.mediaPorVaca !== null && <span className={styles.milkStatUnit}>L</span>}
                </div>
              </div>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Em lactação</div>
                <div className={styles.milkStatValue}>
                  {leite.vacasEmLactacao !== null ? leite.vacasEmLactacao : <EmptyValue />}
                </div>
              </div>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Meta diária</div>
                <div className={styles.milkStatValue}>
                  {leite.metaDiaria !== null ? leite.metaDiaria : <EmptyValue />}
                  {leite.metaDiaria !== null && <span className={styles.milkStatUnit}>L</span>}
                </div>
              </div>
            </div>

            {/* Slot de gráfico/imagem de produção */}
            <ImgSlot label="+ adicionar gráfico de produção" />
          </div>
        </section>

        {/* ══ 3. REBANHO ══ */}
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
                      : `${rebanho.totalAnimais} animais${rebanho.lotes !== null ? ` · ${rebanho.lotes} lotes` : ''}`}
                  </div>
                </div>
              </div>
              <span className={styles.herdBadge}>Rebanho</span>
            </div>

            <div className={styles.herdGrid}>
              <StatBox label="Total animais" value={rebanho.totalAnimais} />
              <StatBox label="Lotes ativos" value={rebanho.lotes} />
              <StatBox label="Prenhas" value={rebanho.prenhas} />
              <StatBox label="Vazias" value={rebanho.vazias} />
              <StatBox label="Machos" value={rebanho.machos} />
              <StatBox label="Fêmeas" value={rebanho.femeas} />
            </div>

            {/* Slot de imagem do rebanho */}
            <ImgSlot label="+ adicionar imagem da propriedade" />
          </div>
        </section>

        {/* ══ 4. FINANCEIRO ══ */}
        <section className={styles.financeSection}>
          <p className={styles.sectionLabel}>💰 Financeiro</p>

          <div className={styles.financeCard}>
            <div className={styles.financeHeader}>
              <div className={styles.financeHeaderLeft}>
                <span className={styles.financeIcon}>📊</span>
                <div>
                  <div className={styles.financeTitle}>Resumo do mês</div>
                  <div className={styles.financePeriod}>
                    {financeiro.periodo || <EmptyValue />}
                  </div>
                </div>
              </div>
              <span className={`${styles.financeBadge} ${financeiro.saldo !== null ? (financeiro.saldo >= 0 ? styles.positive : styles.negative) : ''}`}>
                {financeiro.saldo !== null
                  ? (financeiro.saldo >= 0 ? '▲ Positivo' : '▼ Negativo')
                  : '— —'}
              </span>
            </div>

            <div className={styles.financeGrid}>
              <div className={styles.financeStat}>
                <div className={styles.financeStatLabel}>Receita</div>
                <div className={`${styles.financeStatValue} ${styles.income}`}>
                  {financeiro.receita !== null
                    ? `R$ ${financeiro.receita.toLocaleString('pt-BR')}`
                    : <EmptyValue />}
                </div>
              </div>
              <div className={styles.financeStat}>
                <div className={styles.financeStatLabel}>Despesas</div>
                <div className={`${styles.financeStatValue} ${styles.expense}`}>
                  {financeiro.despesa !== null
                    ? `R$ ${financeiro.despesa.toLocaleString('pt-BR')}`
                    : <EmptyValue />}
                </div>
              </div>
              <div className={styles.financeStat} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.financeStatLabel}>Saldo estimado</div>
                <div className={styles.financeStatValue}>
                  {financeiro.saldo !== null
                    ? `R$ ${financeiro.saldo.toLocaleString('pt-BR')}`
                    : <EmptyValue />}
                </div>
              </div>
            </div>

            {/* Barra de progresso meta financeira */}
            <div className={styles.financeBar}>
              <div
                className={styles.financeBarFill}
                style={{ width: `${financeiro.percentualMeta}%` }}
              />
            </div>
            <div className={styles.financeBarLabel}>
              <span>Meta do mês</span>
              <span>{financeiro.percentualMeta}%</span>
            </div>

            {/* Slot de gráfico financeiro */}
            <ImgSlot label="+ adicionar gráfico financeiro" />
          </div>
        </section>

      </main>

      {/* ── Bottom Nav ── */}
      <PropertyNav activeTab={activeTab} onNav={handleNav} />

    </div>
  )
}

export default PropertyHome
