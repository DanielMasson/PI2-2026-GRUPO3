import {
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { auth } from '../firebase/config'
import { getDb } from '../sqlite/database'
import { obterMeta, definirMeta } from '../sqlite/queries'

// Wrapper local — executar() é interno em queries.js.
function executar(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, err) => { reject(err); return false },
        )
      },
      reject,
    )
  })
}

// Tabelas replicadas (mesmo conjunto do pushQueue). Necessário porque o
// pullEngine precisa saber qual collection Firestore ler para popular qual
// tabela SQLite.
const TABELAS_SYNC = [
  { tabela: 'usuarios', subcollection: 'usuarios' },
  { tabela: 'propriedades', subcollection: 'propriedades' },
  { tabela: 'propriedade_membros', subcollection: 'membros' },
  { tabela: 'animais', subcollection: 'animais' },
  { tabela: 'vacinas', subcollection: 'vacinas' },
  { tabela: 'pesagens', subcollection: 'pesagens' },
  { tabela: 'medicamentos', subcollection: 'medicamentos' },
  { tabela: 'ocorrencias', subcollection: 'ocorrencias' },
  { tabela: 'movimentacoes_local', subcollection: 'movimentacoes' },
  { tabela: 'reproducao', subcollection: 'reproducao' },
  { tabela: 'producao_leite', subcollection: 'producao_leite' },
  { tabela: 'transacoes_financeiras', subcollection: 'transacoes_financeiras' },
  { tabela: 'notificacoes', subcollection: 'notificacoes' },
  { tabela: 'baixas', subcollection: 'baixas' },
]

const META_LAST_PULL = 'last_pull_at'

async function timestampToMillis(ts) {
  if (!ts) return 0
  if (typeof ts === 'number') return ts
  if (ts.toMillis) return ts.toMillis()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

async function buscarLocal(tabela, uuid) {
  const db = getDb()
  const result = await executar(
    db,
    `SELECT updated_at FROM ${tabela} WHERE uuid = ?`,
    [uuid],
  )
  const items = []
  for (let i = 0; i < result.rows.length; i++) {
    items.push(result.rows.item(i))
  }
  if (items.length === 0) return null
  return new Date(items[0].updated_at).getTime()
}

async function upsertLocal(tabela, dados) {
  const db = getDb()
  const { uuid, ...resto } = dados
  const colunas = Object.keys(resto).filter(k => !k.startsWith('_'))
  if (colunas.length === 0) return

  // Verifica se já existe.
  const existe = await buscarLocal(tabela, uuid)

  if (existe === null) {
    // INSERT — sync_status='sincronizado' pois veio do servidor.
    const placeholders = ['?', ...colunas.map(() => '?')]
    const values = [uuid, ...colunas.map(c => dados[c] ?? null)]
    await executar(
      db,
      `INSERT INTO ${tabela} (uuid, ${colunas.join(', ')}, sync_status)
       VALUES (${placeholders.join(', ')}, 'sincronizado')`,
      values,
    )
  } else {
    // UPDATE — preserva sync_status atual para evitar loop.
    const sets = colunas.map(c => `${c} = ?`).join(', ')
    const values = colunas.map(c => dados[c] ?? null)
    await executar(
      db,
      `UPDATE ${tabela} SET ${sets} WHERE uuid = ?`,
      [...values, uuid],
    )
  }
}

async function softDeleteLocal(tabela, uuid) {
  const db = getDb()
  await executar(
    db,
    `UPDATE ${tabela} SET deleted = 1, status = 'removido', sync_status = 'sincronizado' WHERE uuid = ?`,
    [uuid],
  )
}

export async function pullAlteracoes() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Sem usuário autenticado — pull cancelado')
  }
  const uid = user.uid

  const lastPullAt = Number((await obterMeta(META_LAST_PULL)) || 0)

  let totalAplicados = 0
  let totalSkips = 0
  let totalDeletados = 0

  for (const { tabela, subcollection } of TABELAS_SYNC) {
    const ref = collection(db, `users/${uid}/${subcollection}`)
    const snapshot = await getDocs(ref)

    for (const docSnap of snapshot.docs) {
      const dados = docSnap.data()
      const uuid = docSnap.id
      const remoteUpdatedAt = await timestampToMillis(dados._updated_at)
      const localUpdatedAt = await buscarLocal(tabela, uuid)

      // Tombstone: marcou exclusão no servidor.
      if (dados._deleted === true) {
        if (localUpdatedAt !== null) {
          await softDeleteLocal(tabela, uuid)
          totalDeletados += 1
        }
        continue
      }

      // Local não existe — INSERT direto.
      if (localUpdatedAt === null) {
        await upsertLocal(tabela, dados)
        totalAplicados += 1
        continue
      }

      // Last-write-wins.
      if (remoteUpdatedAt > localUpdatedAt) {
        await upsertLocal(tabela, dados)
        totalAplicados += 1
      } else {
        totalSkips += 1
      }
    }
  }

  // Marca o novo last_pull_at como agora (em ms epoch para fácil comparação).
  await definirMeta(META_LAST_PULL, Date.now())

  return { totalAplicados, totalSkips, totalDeletados }
}
