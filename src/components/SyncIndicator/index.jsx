import { useSync } from '../../hooks/useSync'
import styles from './SyncIndicator.module.css'

/**
 * SyncIndicator — badge circular fixo no canto superior direito.
 *
 * Estados:
 *   - sincronizando: spinner verde
 *   - erro: ícone "!" laranja
 *   - offline: ícone "☁️✕" cinza
 *   - idle: ✓ verde (se pendentes = 0) ou número de pendentes em laranja
 *
 * Click → chama sincronizarAgora() (exceto quando já está sincronizando).
 * Hover/focus → tooltip com último sync e contagem de pendentes.
 *
 * Mountado via RotaPrivadaComShell em App.jsx — não precisa de prop.
 */
function SyncIndicator() {
  const { statusSync, pendentesCount, ultimoSyncEm, sincronizarAgora } = useSync()

  const isSincronizando = statusSync === 'sincronizando'

  function handleClick() {
    if (isSincronizando) return
    sincronizarAgora()
  }

  // Texto do tooltip
  const tooltipParts = []
  if (ultimoSyncEm) {
    tooltipParts.push(`Última sync: ${formatRelative(ultimoSyncEm)}`)
  } else {
    tooltipParts.push('Nunca sincronizado')
  }
  if (pendentesCount > 0) {
    tooltipParts.push(`${pendentesCount} pendente${pendentesCount === 1 ? '' : 's'}`)
  }

  // Ícone por estado
  let icon
  let statusClass
  switch (statusSync) {
    case 'sincronizando':
      icon = <span className={styles.spinner} aria-label="Sincronizando" />
      statusClass = styles.statusSincronizando
      break
    case 'erro':
      icon = <span className={styles.icon} aria-label="Erro">!</span>
      statusClass = styles.statusErro
      break
    case 'offline':
      icon = <span className={styles.icon} aria-label="Offline">⊘</span>
      statusClass = styles.statusOffline
      break
    case 'idle':
    default:
      icon = <span className={styles.icon} aria-label="Sincronizado">✓</span>
      statusClass = styles.statusIdle
  }

  return (
    <button
      className={`${styles.indicator} ${statusClass}`}
      onClick={handleClick}
      disabled={isSincronizando}
      aria-label="Status de sincronização"
      type="button"
    >
      {icon}
      {pendentesCount > 0 && statusSync === 'idle' && (
        <span className={styles.badge}>{pendentesCount}</span>
      )}
      <span className={styles.tooltip}>{tooltipParts.join(' · ')}</span>
    </button>
  )
}

function formatRelative(date) {
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 60_000) return 'agora'
  if (diff < 3_600_000) return `há ${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000) return `há ${Math.floor(diff / 3_600_000)} h`
  return date.toLocaleDateString('pt-BR')
}

export default SyncIndicator
