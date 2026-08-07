import { useState, useEffect, useCallback, useRef } from 'react'
import { sincronizarAgora, obterUltimoSync } from '../services/sync/orchestrator'
import { contarPendentes } from '../services/sqlite/queries'
import { auth } from '../services/firebase/config'

// Hook canônico de sync — segue padrão de useAnimais:
//   { dado, carregando, erro, recarregar }
//
// Campos:
//   statusSync: 'idle' | 'sincronizando' | 'erro' | 'offline'
//   pendentesCount: número de linhas não sincronizadas
//   ultimoSyncEm: Date | null
//   sincronizarAgora: () => Promise<void>
//   online: boolean
export function useSync() {
  const [statusSync, setStatusSync] = useState('idle')
  const [pendentesCount, setPendentesCount] = useState(0)
  const [ultimoSyncEm, setUltimoSyncEm] = useState(null)
  const [erro, setErro] = useState(null)
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  // syncRef impede sincronizações concorrentes.
  const sincronizandoRef = useRef(false)

  const atualizarPendentes = useCallback(async () => {
    try {
      const n = await contarPendentes()
      setPendentesCount(n)
    } catch (e) {
      console.error('[useSync] contarPendentes falhou:', e)
    }
  }, [])

  const atualizarUltimoSync = useCallback(async () => {
    try {
      const data = await obterUltimoSync()
      setUltimoSyncEm(data)
    } catch (e) {
      console.error('[useSync] obterUltimoSync falhou:', e)
    }
  }, [])

  const sincronizar = useCallback(async () => {
    if (sincronizandoRef.current) return
    if (!navigator.onLine) {
      setStatusSync('offline')
      return
    }
    if (!auth.currentUser) {
      setStatusSync('idle')
      return
    }

    sincronizandoRef.current = true
    setStatusSync('sincronizando')
    setErro(null)

    try {
      await sincronizarAgora()
      setStatusSync('idle')
      await atualizarUltimoSync()
    } catch (e) {
      console.error('[useSync] sincronizar falhou:', e)
      setErro(e.message || 'Erro desconhecido')
      if (!navigator.onLine) {
        setStatusSync('offline')
      } else {
        setStatusSync('erro')
      }
    } finally {
      sincronizandoRef.current = false
      await atualizarPendentes()
    }
  }, [atualizarPendentes, atualizarUltimoSync])

  // Detecta mudanças online/offline do browser.
  useEffect(() => {
    function onOnline() {
      setOnline(true)
      setStatusSync(prev => (prev === 'offline' ? 'idle' : prev))
    }
    function onOffline() {
      setOnline(false)
      setStatusSync('offline')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Atualiza contagem e último sync no mount + sempre que muda online.
  useEffect(() => {
    atualizarPendentes()
    atualizarUltimoSync()
  }, [atualizarPendentes, atualizarUltimoSync, online])

  return {
    statusSync,
    pendentesCount,
    ultimoSyncEm,
    sincronizarAgora: sincronizar,
    online,
    erro,
  }
}
