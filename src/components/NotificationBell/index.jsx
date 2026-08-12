import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import NotificationPanel from '../NotificationPanel'
import styles from './NotificationBell.module.css'

/**
 * NotificationBell — badge circular fixo no canto superior direito.
 * Abaixo do SyncIndicator (top: 128px).
 *
 * Estados:
 *   - idle: sino com badge vermelho (count > 0) ou sem badge
 *   - aberto: painel de notificações visível
 *
 * Click → abre/fecha o NotificationPanel.
 */
function NotificationBell() {
  const { propriedadeId } = useParams()
  const { countNaoLidas, carregando } = useNotificacoes(propriedadeId)
  const [painelAberto, setPainelAberto] = useState(false)

  function handleClick() {
    setPainelAberto(prev => !prev)
  }

  function handleFechar() {
    setPainelAberto(false)
  }

  return (
    <>
      <button
        className={`${styles.bell} ${painelAberto ? styles.bellAtivo : ''}`}
        onClick={handleClick}
        aria-label={`Notificações${countNaoLidas > 0 ? ` — ${countNaoLidas} não lida${countNaoLidas === 1 ? '' : 's'}` : ''}`}
        type="button"
      >
        <span className={styles.icon}>🔔</span>
        {!carregando && countNaoLidas > 0 && (
          <span className={styles.badge}>
            {countNaoLidas > 99 ? '99+' : countNaoLidas}
          </span>
        )}
        <span className={styles.tooltip}>
          {countNaoLidas > 0
            ? `${countNaoLidas} não lida${countNaoLidas === 1 ? '' : 's'}`
            : 'Nenhuma notificação'}
        </span>
      </button>

      {painelAberto && (
        <NotificationPanel
          propriedadeId={propriedadeId}
          onFechar={handleFechar}
        />
      )}
    </>
  )
}

export default NotificationBell
