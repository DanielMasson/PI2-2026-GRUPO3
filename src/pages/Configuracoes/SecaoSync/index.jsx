import { useSync } from '../../../hooks/useSync'
import styles from '../Configuracoes.module.css'

/**
 * SecaoSync — seção "Sincronização" da página de Configurações.
 *
 * Mostra estado real do sync (último syncEm, pendentes, status) e expõe
 * um botão "Sincronizar agora" que chama `sincronizarAgora()`.
 *
 * Substitui os toggles placeholder (syncAuto/apenasWifi/intervalo) que
 * estavam no layout estático anterior — sync automático em background
 * está fora de escopo do MVP (ratificado em AskUserQuestion 05/08).
 */
function SecaoSync() {
  const {
    statusSync,
    pendentesCount,
    ultimoSyncEm,
    sincronizarAgora,
    online,
    erro,
  } = useSync()

  const sincronizando = statusSync === 'sincronizando'

  function labelStatus() {
    if (statusSync === 'sincronizando') return 'Sincronizando'
    if (statusSync === 'erro') return 'Erro'
    if (statusSync === 'offline' || !online) return 'Offline'
    if (pendentesCount > 0) return `${pendentesCount} pendente${pendentesCount === 1 ? '' : 's'}`
    return 'Sincronizado'
  }

  function classeStatus() {
    if (statusSync === 'sincronizando') return styles.sincronizando
    if (statusSync === 'erro') return styles.erro
    if (statusSync === 'offline' || !online) return styles.offline
    if (pendentesCount > 0) return styles.pendente
    return styles.sincronizado
  }

  function descricaoStatus() {
    if (statusSync === 'erro' && erro) return erro
    if (ultimoSyncEm) {
      return `Última sync: ${formatarRelativo(ultimoSyncEm)}`
    }
    return 'Nunca sincronizado'
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Sincronização</div>
      <div className={styles.sectionCard}>
        {/* Item 1: status atual + último sync */}
        <div className={styles.item}>
          <span className={styles.itemIcon}>☁️</span>
          <div className={styles.itemContent}>
            <span className={styles.itemLabel}>Status</span>
            <span className={styles.itemDesc}>{descricaoStatus()}</span>
          </div>
          <span className={`${styles.statusBadge} ${classeStatus()}`}>
            {labelStatus()}
          </span>
        </div>

        {/* Item 2: contagem de pendentes */}
        <div className={styles.item}>
          <span className={styles.itemIcon}>📋</span>
          <div className={styles.itemContent}>
            <span className={styles.itemLabel}>Pendentes</span>
            <span className={styles.itemDesc}>
              {pendentesCount === 0
                ? 'Tudo sincronizado'
                : `${pendentesCount} ${pendentesCount === 1 ? 'alteração aguardando' : 'alterações aguardando'} envio`}
            </span>
          </div>
        </div>

        {/* Item 3: botão manual de sincronização */}
        <div
          className={styles.item}
          onClick={sincronizando ? undefined : sincronizarAgora}
        >
          <span className={styles.itemIcon}>🔃</span>
          <div className={styles.itemContent}>
            <span className={styles.itemLabel}>
              {sincronizando ? 'Sincronizando...' : 'Sincronizar agora'}
            </span>
            <span className={styles.itemDesc}>
              {online
                ? 'Envia alterações locais e baixa mudanças remotas'
                : 'Indisponível offline'}
            </span>
          </div>
          {!sincronizando && online && <span className={styles.itemArrow}>›</span>}
        </div>
      </div>
    </div>
  )
}

function formatarRelativo(date) {
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'agora há pouco'
  if (diff < 3_600_000) return `há ${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000) return `há ${Math.floor(diff / 3_600_000)} h`
  return date.toLocaleDateString('pt-BR')
}

export default SecaoSync
