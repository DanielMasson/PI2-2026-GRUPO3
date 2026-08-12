// Notificacoes — Sprint 11
// Service layer fino que delega para sqlite/queries (padrão financeiroService.js).
// Centraliza operações de CRUD de notificações persistente.

import * as sqlite from './sqlite/queries'

export async function registrar(dados) {
  const uuid = await sqlite.inserirNotificacao(dados)
  return await sqlite.buscarNotificacao(uuid)
}

export async function buscar(uuid) {
  return await sqlite.buscarNotificacao(uuid)
}

export async function buscarPorTipoRef(propriedadeUuid, tipo, referenciaUuid) {
  return await sqlite.buscarNotificacaoPorTipoRef(propriedadeUuid, tipo, referenciaUuid)
}

export async function listarNaoLidas(propriedadeUuid) {
  return await sqlite.listarNaoLidasPropriedade(propriedadeUuid)
}

export async function listarTodas(propriedadeUuid, filtros) {
  return await sqlite.listarTodasPropriedade(propriedadeUuid, filtros)
}

export async function contarNaoLidas(propriedadeUuid) {
  return await sqlite.contarNaoLidasPropriedade(propriedadeUuid)
}

export async function marcarComoLida(uuid) {
  return await sqlite.marcarNotificacaoLida(uuid)
}

export async function marcarTodasComoLidas(propriedadeUuid) {
  return await sqlite.marcarTodasNotificacoesLidas(propriedadeUuid)
}

export async function excluir(uuid) {
  return await sqlite.excluirNotificacao(uuid)
}

export async function excluirPorTipoRef(propriedadeUuid, tipo, referenciaUuid) {
  return await sqlite.excluirNotificacoesPorTipoRef(propriedadeUuid, tipo, referenciaUuid)
}
