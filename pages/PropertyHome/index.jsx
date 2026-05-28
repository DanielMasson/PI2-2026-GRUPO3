import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './PropertyHome.module.css'

/* ─── Dados de exemplo — substitua por props/API futuramente ─── */
const MOCK_PROPERTY = {
  nome: 'Fazenda Norte',
  localizacao: 'Sorriso, MT',
}

/* Alertas — [] = sem alertas; adicione objetos conforme necessário */
const ALERTAS = [
  {
    id: 1,
    tipo: 'danger',        // 'danger' | 'warning' | 'info'
    icone: '🩺',
    titulo: 'Vacinação em atraso',
    descricao: '14 animais com vacina vencida no lote A3',
    tempo: 'Há 2 horas',
  },
  {
    id: 2,
    tipo: 'warning',
    icone: '⚠️',
    titulo: 'Produção abaixo da meta',
    descricao: 'Ontem a produção ficou 12% abaixo da média semanal',
    tempo: 'Há 6 horas',
  },
]

/* Leite — última coleta */
const LEITE = {
  dataColeta: '17/05/2025',
  totalLitros: null,           // null = campo vazio (placeholder)
  mediaPorVaca: null,
  vacasEmLactacao: null,
  metaDiaria: null,
}

/* Rebanho */
const REBANHO = {
  totalAnimais: 240,
  lotes: 8,
  prenhas: null,
  vazias: null,
  machos: null,
  femeas: null,
}

/* Financeiro */
const FINANCEIRO = {
  periodo: 'Maio 2025',
  receita: null,
  despesa: null,
  saldo: null,
  percentualMeta: 0,    // 0–100
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

  const prop = MOCK_PROPERTY

  const NAV_ITEMS = [
    { key: 'inicio',   label: 'Início',  icone: '🏠' },
    { key: 'animais',  label: 'Animais', icone: '🐄' },
    { key: 'lotes',    label: 'Lotes',   icone: '🌾' },
    { key: 'tarefas',  label: 'Tarefas', icone: '📋' },
    { key: 'perfil',   label: 'Perfil',  icone: '👤' },
  ]

  function handleNav(key) {
    if (key === 'animais') {
      navigate(`/propriedade/${propriedadeId}/cadastro-animal`)
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
            <div className={styles.topbarTitle}>{prop.nome}</div>
            <div className={styles.topbarSub}>{prop.localizacao}</div>
          </div>
        </div>
        <div className={styles.topbarActions}>
          <button className={styles.iconBtn} title="Notificações">🔔</button>
          <button className={styles.iconBtn} title="Configurações">⚙️</button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className={styles.scrollArea}>

        {/* ══ 1. ALERTAS ══ */}
        <section className={styles.alertsSection}>
          <p className={styles.sectionLabel}>⚡ Alertas</p>

          {ALERTAS.length === 0 ? (
            <div className={styles.noAlerts}>
              Nenhum alerta no momento ✓
            </div>
          ) : (
            ALERTAS.map(alert => (
              <div
                key={alert.id}
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
                  <div className={styles.milkDate}>{LEITE.dataColeta}</div>
                </div>
              </div>
              <span className={styles.milkBadge}>Leite</span>
            </div>

            <div className={styles.milkStats}>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Total coletado</div>
                <div className={styles.milkStatValue}>
                  {LEITE.totalLitros !== null ? LEITE.totalLitros : <EmptyValue />}
                  {LEITE.totalLitros !== null && <span className={styles.milkStatUnit}>L</span>}
                </div>
              </div>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Média por vaca</div>
                <div className={styles.milkStatValue}>
                  {LEITE.mediaPorVaca !== null ? LEITE.mediaPorVaca : <EmptyValue />}
                  {LEITE.mediaPorVaca !== null && <span className={styles.milkStatUnit}>L</span>}
                </div>
              </div>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Em lactação</div>
                <div className={styles.milkStatValue}>
                  {LEITE.vacasEmLactacao !== null ? LEITE.vacasEmLactacao : <EmptyValue />}
                </div>
              </div>
              <div className={styles.milkStat}>
                <div className={styles.milkStatLabel}>Meta diária</div>
                <div className={styles.milkStatValue}>
                  {LEITE.metaDiaria !== null ? LEITE.metaDiaria : <EmptyValue />}
                  {LEITE.metaDiaria !== null && <span className={styles.milkStatUnit}>L</span>}
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
                    {REBANHO.totalAnimais} animais · {REBANHO.lotes} lotes
                  </div>
                </div>
              </div>
              <span className={styles.herdBadge}>Rebanho</span>
            </div>

            <div className={styles.herdGrid}>
              <StatBox label="Total animais" value={REBANHO.totalAnimais} />
              <StatBox label="Lotes ativos"  value={REBANHO.lotes} />
              <StatBox label="Prenhas"       value={REBANHO.prenhas} />
              <StatBox label="Vazias"        value={REBANHO.vazias} />
              <StatBox label="Machos"        value={REBANHO.machos} />
              <StatBox label="Fêmeas"        value={REBANHO.femeas} />
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
                  <div className={styles.financePeriod}>{FINANCEIRO.periodo}</div>
                </div>
              </div>
              <span className={`${styles.financeBadge} ${FINANCEIRO.saldo >= 0 ? styles.positive : styles.negative}`}>
                {FINANCEIRO.saldo !== null
                  ? (FINANCEIRO.saldo >= 0 ? '▲ Positivo' : '▼ Negativo')
                  : '— —'}
              </span>
            </div>

            <div className={styles.financeGrid}>
              <div className={styles.financeStat}>
                <div className={styles.financeStatLabel}>Receita</div>
                <div className={`${styles.financeStatValue} ${styles.income}`}>
                  {FINANCEIRO.receita !== null
                    ? `R$ ${FINANCEIRO.receita.toLocaleString('pt-BR')}`
                    : <EmptyValue />}
                </div>
              </div>
              <div className={styles.financeStat}>
                <div className={styles.financeStatLabel}>Despesas</div>
                <div className={`${styles.financeStatValue} ${styles.expense}`}>
                  {FINANCEIRO.despesa !== null
                    ? `R$ ${FINANCEIRO.despesa.toLocaleString('pt-BR')}`
                    : <EmptyValue />}
                </div>
              </div>
              <div className={styles.financeStat} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.financeStatLabel}>Saldo estimado</div>
                <div className={styles.financeStatValue}>
                  {FINANCEIRO.saldo !== null
                    ? `R$ ${FINANCEIRO.saldo.toLocaleString('pt-BR')}`
                    : <EmptyValue />}
                </div>
              </div>
            </div>

            {/* Barra de progresso meta financeira */}
            <div className={styles.financeBar}>
              <div
                className={styles.financeBarFill}
                style={{ width: `${FINANCEIRO.percentualMeta}%` }}
              />
            </div>
            <div className={styles.financeBarLabel}>
              <span>Meta do mês</span>
              <span>{FINANCEIRO.percentualMeta}%</span>
            </div>

            {/* Slot de gráfico financeiro */}
            <ImgSlot label="+ adicionar gráfico financeiro" />
          </div>
        </section>

      </main>

      {/* ── Bottom Nav ── */}
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
            onClick={() => handleNav(item.key)}
          >
            <span className={styles.navIcon}>{item.icone}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

export default PropertyHome