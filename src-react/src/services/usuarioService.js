/**
 * Service de negócio — Usuários
 * Orquestra operações SQLite (MVP).
 * No pós-MVP, integrará com Firebase Auth.
 */
import * as sqlite from './sqlite/queries'

export async function buscarUsuario(firebaseUid) {
  // Resolve pelo Firebase UID (a tabela `usuarios` tem coluna `firebase_uid`).
  return await sqlite.buscarUsuario(firebaseUid)
}

export async function buscarUsuarioPorFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null
  const linha = await sqlite.buscarUsuario(firebaseUid)
  if (!linha) return null
  // Normaliza o shape para o app usar `uuid`/`cargo`/`foto_url` consistentes.
  return {
    uuid: linha.uuid,
    firebase_uid: linha.firebase_uid || firebaseUid,
    nome: linha.nome || null,
    email: linha.email || null,
    telefone: linha.telefone || null,
    foto_url: linha.foto_url || null,
    cargo: linha.cargo || 'membro',
    created_at: linha.created_at,
    updated_at: linha.updated_at,
  }
}

export async function criarUsuario(dados) {
  const existente = await sqlite.buscarUsuario(dados.firebase_uid)
  if (existente?.uuid) {
    await sqlite.atualizarUsuario(existente.uuid, dados)
    return await sqlite.buscarUsuarioPorUuid(existente.uuid)
  }
  const uuid = await sqlite.inserirUsuario(dados)
  return await sqlite.buscarUsuarioPorUuid(uuid)
}

export async function editarUsuario(uuid, dados) {
  await sqlite.atualizarUsuario(uuid, dados)
  return await sqlite.buscarUsuarioPorUuid(uuid)
}

export async function listarMembros(propriedadeUuid) {
  return await sqlite.listarMembros(propriedadeUuid)
}
