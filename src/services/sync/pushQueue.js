import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/firestore'
import { auth } from '../firebase/config'
import * as sqlite from '../sqlite/queries'

// Tabelas locais que são replicadas no Firestore.
// A chave do mapa é o nome da tabela SQLite; o valor é o nome da
// subcollection em users/{uid}/. Não inclui tabelas apenas-locais
// (ex.: _sync_meta).
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

const BATCH_SIZE = 500 // limite Firestore

// Remove colunas internas de SQLite do payload que vai para Firestore.
function sanitizarDoc(linha) {
  // Mantém todas as colunas exceto as internas de SQLite.
  // sync_status/synced_at são resolvidos pelo servidor de auth/firestore,
  // não devem ir para cima.
  const { sync_status, synced_at, ...payload } = linha
  return payload
}

export async function pushPendentes() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Sem usuário autenticado — push cancelado')
  }
  const uid = user.uid

  let totalEnviados = 0
  let totalFalhas = 0
  const erros = []

  for (const { tabela, subcollection } of TABELAS_SYNC) {
    const pendentes = await sqlite.listarPendentes(tabela)
    if (pendentes.length === 0) continue

    // Divide em chunks de BATCH_SIZE (limite Firestore writeBatch).
    for (let i = 0; i < pendentes.length; i += BATCH_SIZE) {
      const chunk = pendentes.slice(i, i + BATCH_SIZE)
      const batch = writeBatch(db)

      chunk.forEach(linha => {
        const ref = doc(
          db,
          `users/${uid}/${subcollection}`,
          linha.uuid,
        )
        const payload = {
          ...sanitizarDoc(linha),
          _updated_at: serverTimestamp(),
          _deleted: linha.deleted === 1 || linha.status === 'removido',
        }
        batch.set(ref, payload, { merge: true })
      })

      try {
        await batch.commit()
        // Marca todos do chunk como sincronizado.
        for (const linha of chunk) {
          await sqlite.marcarSincronizado(tabela, linha.uuid)
          totalEnviados += 1
        }
      } catch (err) {
        // Falha no chunk inteiro — provavelmente permissão ou quota.
        // Deixa sync_status='modificado' para retry.
        totalFalhas += chunk.length
        erros.push({ tabela, chunkSize: chunk.length, erro: err.message })
        console.error(`[pushQueue] Falha batch ${tabela}:`, err)
      }
    }
  }

  return { totalEnviados, totalFalhas, erros }
}
