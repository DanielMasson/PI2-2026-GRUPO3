import { criarTabelas, aplicarMigracoes } from './migrations'
import { criarFallbackWeb } from './webFallback'

let db = null

function isCordova() {
  return !!window.sqlitePlugin
}

export async function initDatabase() {
  if (isCordova()) {
    db = window.sqlitePlugin.openDatabase({
      name: 'propriedade_inteligente.db',
      location: 'default',
    })
  } else {
    console.warn('[SQLite] sqlitePlugin não encontrado — usando fallback web (localStorage)')
    db = criarFallbackWeb()
  }

  await criarTabelas(db)
  await aplicarMigracoes(db)
  return db
}

export function getDb() {
  if (!db) throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.')
  return db
}
