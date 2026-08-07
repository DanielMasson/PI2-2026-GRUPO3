import { pushPendentes } from './pushQueue'
import { pullAlteracoes } from './pullEngine'
import { auth } from '../firebase/config'
import { definirMeta, obterMeta } from '../sqlite/queries'

const META_LAST_SYNC = 'last_sync_at'

export async function sincronizarAgora() {
  if (!navigator.onLine) {
    throw new Error('Sem conexão de internet')
  }
  if (!auth.currentUser) {
    throw new Error('Sem usuário autenticado')
  }

  // Push primeiro: garante que modificações locais vão para cima antes
  // do pull puxar mudanças remotas (evita clobber local).
  const pushResult = await pushPendentes()
  const pullResult = await pullAlteracoes()

  const timestamp = new Date().toISOString()
  await definirMeta(META_LAST_SYNC, timestamp)

  return {
    ...pushResult,
    ...pullResult,
    sincronizadoEm: timestamp,
  }
}

export async function obterUltimoSync() {
  const value = await obterMeta(META_LAST_SYNC)
  return value ? new Date(value) : null
}
