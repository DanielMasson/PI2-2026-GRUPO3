import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import styles from './NotificationPanel.module.css'

const MODULO_LABEL = {
  vacinas: 'Vacinas',
  reproducao: 'Reprodução',
  medicamentos: 'Medicamentos',
  leite: 'Leite',
  corte: 'Corte',
}

const MODULO_ICONE = {
  vacinas: '🩺',
  reproducao: '🐄',
  medicamentos: '💊',
  leite: '🥛',
  corte: '🥩',
}

const NIVEL_COR = {
  danger: '#e74c3c',
  warning: '#e67e22',
  info: '#2980b9',
}

const NIVEL_LABEL = {
  danger: 'Urgente',
  warning: 'Atenção',
  info: 'Info',
}

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'vacinas', label: 'Vacinas' },
  { key: 'reproducao', label: 'Reprodução' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'leite', label: 'Leite' },
  { key: 'corte', label: 'Corte' },
]

function formatarTempo(dateStr) {
  if (!dateStr) return ''
  const data = new Date(dateStr)
  const agora = new Date()
  const diffMs = agora - data
  if (diffMs < 60_000) return 'agora'
  if (diffMs < 3_600_000) return `há ${Math.floor(diffMs / 60_000)} min`
  if (diffMs < 86_400_000) return `há ${Math.floor(diffMs / 3_600_000)}h`
  if (diffMs < 172_800_000) return 'ontem'
  return data.toLocaleDateString('pt-BR')
}

function agruparPorData(notificacoes) {
  const grupos = {}
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  for (const n of notificacoes) {
    const d = new Date(n.created_at)
    d.setHours(0, 0, 0, 0)

    let chave
    if (d.getTime() === hoje.getTime()) chave = 'Hoje'
    else if (d.getTime() === ontem.getTime()) chave = 'Ontem'
    else chave = d.toLocaleDateString('pt-BR')

    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(n)
  }
  return grupos
}

export default function NotificationPanel({ propriedadeId, onFechar }) {
  const navigate = useNavigate()
  const {
    notificacoes,
    countNaoLidas,
    carregando,
    sincronizar,
    marcarComoLida,
    marcarTodasComoLidas,
    excluir,
    notificacoesHabilitadas,
    toggleNotificacoes,
  } = useNotificacoes(propriedadeId)

  const [filtroModulo, setFiltroModulo] = useState('todas')
  const [processando, setProcessando] = useState(false)

  const notificacoesFiltradas = useMemo(() => {
    if (filtroModulo === 'todas') return notificacoes
    return notificacoes.filter(n => n.modulo === filtroModulo)
  }, [notificacoes, filtroModulo])

  const grupos = useMemo(() => agruparPorData(notificacoesFiltradas), [notificacoesFiltradas])

  async function handleMarcarTodasLidas() {
    setProcessando(true)
    try {
      await marcarTodasComoLidas()
    } finally {
      setProcessando(false)
    }
  }

  async function handleMarcarLida(uuid) {
    await marcarComoLida(uuid)
  }

  async function handleExcluir(uuid) {
    await excluir(uuid)
  }

  async function handleSincronizar() {
    setProcessando(true)
    try {
      await sincronizar()
    } finally {
      setProcessando(false)
    }
  }

  function handleNotificacaoClick(notif) {
    if (!notif.lida) {
      handleMarcarLida(notif.uuid)
    }
    // Navegar para o módulo correspondente
    if (notif.modulo === 'vacinas' || notif.modulo === 'medicamentos') {
      navigate(`/propriedade/${propriedadeId}/saude`)
    } else if (notif.modulo === 'reproducao') {
      navigate(`/propriedade/${propriedadeId}/reproducao`)
    } else if (notif.modulo === 'leite') {
      navigate(`/propriedade/${propriedadeId}/producao-leite/alertas`)
    } else if (notif.modulo === 'corte') {
      navigate(`/propriedade/${propriedadeId}/corte/alertas`)
    }
    onFechar()
  }

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onFechar} />

      {/* Painel */}
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.titulo}>Notificações</h2>
          <div className={styles.headerActions}>
            {countNaoLidas > 0 && (
              <button
                className={styles.marcarTodasBtn}
                onClick={handleMarcarTodasLidas}
                disabled={processando}
                type="button"
              >
                Marcar todas como lidas
              </button>
            )}
            <button className={styles.fecharBtn} onClick={onFechar} type="button" aria-label="Fechar">
              ✕
            </button>
          </div>
        </div>

        {/* Toggle notificações nativas */}
        <div className={styles.toggleBar}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Notificações do celular</span>
            <span className={styles.toggleDesc}>
              {notificacoesHabilitadas ? 'Ativadas' : 'Desativadas'}
            </span>
          </div>
          <button
            className={`${styles.toggle} ${notificacoesHabilitadas ? styles.toggleOn : ''}`}
            type="button"
            aria-label="Alternar notificações do celular"
            onClick={() => {
              toggleNotificacoes(!notificacoesHabilitadas)
            }}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* Filtros por módulo */}
        <div className={styles.filtros}>
          {FILTROS.map(f => (
            <button
              key={f.key}
              className={`${styles.filtroBtn} ${filtroModulo === f.key ? styles.filtroAtivo : ''}`}
              onClick={() => setFiltroModulo(f.key)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className={styles.conteudo}>
          {carregando ? (
            <div className={styles.emptyState}>Carregando...</div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>✓</span>
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            Object.entries(grupos).map(([data, items]) => (
              <div key={data} className={styles.grupo}>
                <div className={styles.grupoData}>{data}</div>
                {items.map(notif => (
                  <div
                    key={notif.uuid}
                    className={`${styles.notifCard} ${notif.lida ? styles.notifLida : ''}`}
                    onClick={() => handleNotificacaoClick(notif)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className={styles.nivelBar}
                      style={{ backgroundColor: NIVEL_COR[notif.nivel] || '#c8a97e' }}
                    />
                    <div className={styles.notifIcon}>
                      {MODULO_ICONE[notif.modulo] || 'ℹ️'}
                    </div>
                    <div className={styles.notifBody}>
                      <div className={styles.notifHeader}>
                        <span className={styles.notifModulo}>{MODULO_LABEL[notif.modulo] || notif.modulo}</span>
                        <span className={styles.notifTempo}>{formatarTempo(notif.created_at)}</span>
                      </div>
                      <div className={styles.notifTitulo}>{notif.titulo}</div>
                      <div className={styles.notifMeta}>
                        <span
                          className={styles.nivelBadge}
                          style={{
                            backgroundColor: `${NIVEL_COR[notif.nivel] || '#c8a97e'}22`,
                            color: NIVEL_COR[notif.nivel] || '#c8a97e',
                            borderColor: `${NIVEL_COR[notif.nivel] || '#c8a97e'}44`,
                          }}
                        >
                          {NIVEL_LABEL[notif.nivel] || notif.nivel}
                        </span>
                      </div>
                      {notif.descricao && (
                        <div className={styles.notifDesc}>{notif.descricao}</div>
                      )}
                    </div>
                    <button
                      className={styles.excluirBtn}
                      onClick={(e) => { e.stopPropagation(); handleExcluir(notif.uuid) }}
                      type="button"
                      aria-label="Excluir notificação"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.sincronizarBtn}
            onClick={handleSincronizar}
            disabled={processando}
            type="button"
          >
            {processando ? 'Sincronizando...' : '🔄 Sincronizar alertas'}
          </button>
        </div>
      </div>
    </>
  )
}
